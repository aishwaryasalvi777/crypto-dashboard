import { useCallback, useEffect, useState } from "react";
import { useRevalidator } from "@remix-run/react";

/**
 * Manual + interval refresh built on Remix's revalidator, so refreshing simply re-runs the
 * loader (server-side fetch) — no client API logic. Returns whether a refresh is in flight
 * for the spinner, plus auto-refresh toggle state.
 */
export function useAutoRefresh(intervalSeconds: number, initialAuto = true) {
  const revalidator = useRevalidator();
  const [auto, setAuto] = useState(initialAuto);

  const refresh = useCallback(() => {
    revalidator.revalidate();
  }, [revalidator]);

  const toggleAuto = useCallback(() => setAuto((a) => !a), []);

  useEffect(() => {
    if (!auto) return;
    const ms = Math.max(10, intervalSeconds) * 1000;
    const timer = setInterval(() => revalidator.revalidate(), ms);
    return () => clearInterval(timer);
  }, [auto, intervalSeconds, revalidator]);

  return {
    refresh,
    auto,
    toggleAuto,
    isRefreshing: revalidator.state === "loading",
  };
}
