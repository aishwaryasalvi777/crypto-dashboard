import { useCallback, useEffect, useRef, useState } from "react";
import { useRevalidator } from "@remix-run/react";

/**
 * Manual + interval refresh built on Remix's revalidator, so refreshing simply re-runs the
 * loader (server-side fetch) — no client API logic. Returns whether a refresh is in flight
 * for the spinner, auto-refresh toggle state, and a live countdown to the next refresh.
 */
export function useAutoRefresh(intervalSeconds: number, initialAuto = true) {
  const revalidator = useRevalidator();
  const [auto, setAuto] = useState(initialAuto);
  const clampedRef = useRef(Math.max(10, intervalSeconds));
  const [countdown, setCountdown] = useState(clampedRef.current);

  const refresh = useCallback(() => {
    revalidator.revalidate();
    setCountdown(clampedRef.current);
  }, [revalidator]);

  const toggleAuto = useCallback(() => setAuto((a) => !a), []);

  useEffect(() => {
    clampedRef.current = Math.max(10, intervalSeconds);
  }, [intervalSeconds]);

  useEffect(() => {
    if (!auto) {
      setCountdown(clampedRef.current);
      return;
    }

    let remaining = clampedRef.current;
    setCountdown(remaining);

    const tick = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        revalidator.revalidate();
        remaining = clampedRef.current;
      }
      setCountdown(remaining);
    }, 1000);

    return () => clearInterval(tick);
  }, [auto, revalidator]);

  return {
    refresh,
    auto,
    toggleAuto,
    countdown,
    isRefreshing: revalidator.state === "loading",
  };
}
