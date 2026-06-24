/**
 * Tiny TTL cache with in-flight request de-duplication. Keeps the live price endpoints from being
 * hammered: within `ttlMs` every caller gets the same cached result, and concurrent misses share a
 * single in-flight request instead of each firing their own. Per server instance (in serverless,
 * per warm instance) — enough to absorb multi-tab / multi-user polling against a free endpoint.
 *
 * Only successful results are cached; a rejected loader is not stored and the in-flight entry is
 * cleared, so the next call retries.
 */
export function createTtlCache<T>(ttlMs: number) {
  interface Entry {
    at: number;
    data: T;
  }
  const store = new Map<string, Entry>();
  const inflight = new Map<string, Promise<T>>();

  return function get(key: string, loader: () => Promise<T>): Promise<T> {
    const hit = store.get(key);
    if (hit && Date.now() - hit.at < ttlMs) return Promise.resolve(hit.data);

    const existing = inflight.get(key);
    if (existing) return existing;

    const pending = loader()
      .then((data) => {
        store.set(key, { at: Date.now(), data });
        return data;
      })
      .finally(() => {
        inflight.delete(key);
      });

    inflight.set(key, pending);
    return pending;
  };
}
