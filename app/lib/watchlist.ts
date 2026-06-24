import { DEFAULT_WATCHLIST } from "./crypto/coins";

/** A fresh copy of the default watchlist (symbols) for first-time / reset use. */
export function defaultWatchlist(): string[] {
  return [...DEFAULT_WATCHLIST];
}

/** Drop watchlist entries that are no longer in the catalog, preserving order. */
export function reconcileWatchlist(saved: string[], catalogIds: string[]): string[] {
  const inCatalog = new Set(catalogIds);
  return saved.filter((id) => inCatalog.has(id));
}

/** Append a coin to the watchlist (no-op if already present). */
export function addToWatchlist(list: string[], id: string): string[] {
  return list.includes(id) ? list : [...list, id];
}

/** Remove a coin from the watchlist. */
export function removeFromWatchlist(list: string[], id: string): string[] {
  return list.filter((x) => x !== id);
}
