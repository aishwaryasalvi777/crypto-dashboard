import { useCallback, useEffect, useState } from "react";

/**
 * SSR-safe localStorage-backed state. Renders `initialValue` on the server and on the
 * first client render (so hydration matches), then reads the persisted value after mount.
 * All persisted dashboard state goes through this with a `cd_` key prefix (CLAUDE.md §5).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  parse?: (raw: string) => T | undefined,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return;
      const parsed = parse ? parse(raw) : (JSON.parse(raw) as T);
      if (parsed !== undefined) setValue(parsed);
    } catch {
      /* ignore malformed / unavailable storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          window.localStorage.setItem(
            key,
            typeof resolved === "string" ? resolved : JSON.stringify(resolved),
          );
        } catch {
          /* ignore quota / unavailable storage */
        }
        return resolved;
      });
    },
    [key],
  );

  return [value, set];
}
