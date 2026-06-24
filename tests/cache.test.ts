import { describe, expect, it } from "vitest";

import { createTtlCache } from "~/lib/crypto/cache.server";

describe("createTtlCache", () => {
  it("caches within the TTL (loader runs once for repeated calls)", async () => {
    let calls = 0;
    const cache = createTtlCache<number>(10_000);
    const load = async () => ++calls;

    expect(await cache("k", load)).toBe(1);
    expect(await cache("k", load)).toBe(1);
    expect(calls).toBe(1);
  });

  it("de-duplicates concurrent in-flight requests", async () => {
    let calls = 0;
    const cache = createTtlCache<number>(10_000);
    const load = () =>
      new Promise<number>((resolve) => setTimeout(() => resolve(++calls), 5));

    const [a, b] = await Promise.all([cache("k", load), cache("k", load)]);
    expect(a).toBe(1);
    expect(b).toBe(1);
    expect(calls).toBe(1);
  });

  it("re-runs the loader once the entry has expired (ttl 0)", async () => {
    let calls = 0;
    const cache = createTtlCache<number>(0);
    const load = async () => ++calls;

    await cache("k", load);
    await cache("k", load);
    expect(calls).toBe(2);
  });

  it("keeps separate entries per key", async () => {
    const cache = createTtlCache<string>(10_000);
    expect(await cache("a", async () => "A")).toBe("A");
    expect(await cache("b", async () => "B")).toBe("B");
  });

  it("does not cache a rejected loader (retries next call)", async () => {
    let calls = 0;
    const cache = createTtlCache<number>(10_000);
    await expect(
      cache("k", async () => {
        calls++;
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    // Next call retries rather than returning a cached failure.
    expect(await cache("k", async () => ++calls)).toBe(2);
  });
});
