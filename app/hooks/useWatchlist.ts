import { useCallback, useEffect, useRef, useState } from "react";

import { DEFAULT_WATCHLIST } from "~/lib/crypto/coins";
import { moveItem } from "~/lib/order";
import { addToWatchlist, reconcileWatchlist, removeFromWatchlist } from "~/lib/watchlist";
import { useLocalStorage } from "./useLocalStorage";

const WATCHLIST_KEY = "cd_watchlist";

export interface Watchlist {
  /** Ordered list of coin ids (symbols) the user is tracking. Doubles as the card order. */
  ids: string[];
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
  add: (id: string) => void;
  remove: (id: string) => void;
  has: (id: string) => boolean;
}

/**
 * The user's customizable watchlist: an ordered set of coin ids, persisted to localStorage
 * (default = `DEFAULT_WATCHLIST`). Supports add / remove / drag-reorder, and reconciles against the
 * live catalog so stale entries drop out. The ordered list is also the card order (one source of
 * truth). Pure logic lives in `lib/watchlist.ts` + `lib/order.ts`; this is the React shell.
 */
export function useWatchlist(catalogIds: string[]): Watchlist {
  const [ids, setIds] = useLocalStorage<string[]>(WATCHLIST_KEY, [...DEFAULT_WATCHLIST], (raw) => {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const idsKey = catalogIds.join(",");
  const lastReconciled = useRef("");

  // Drop watchlist entries the catalog no longer has — but never against an empty/failed catalog.
  useEffect(() => {
    if (!catalogIds.length || lastReconciled.current === idsKey) return;
    lastReconciled.current = idsKey;
    setIds((prev) => reconcileWatchlist(prev, catalogIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const add = useCallback((id: string) => setIds((prev) => addToWatchlist(prev, id)), [setIds]);
  const remove = useCallback((id: string) => setIds((prev) => removeFromWatchlist(prev, id)), [setIds]);
  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const onDragStart = useCallback((id: string) => setDragId(id), []);
  const onDragEnd = useCallback(() => setDragId(null), []);
  const onDragEnter = useCallback(
    (targetId: string) => {
      setDragId((current) => {
        if (current && current !== targetId) setIds((prev) => moveItem(prev, current, targetId));
        return current;
      });
    },
    [setIds],
  );

  return { ids, dragId, onDragStart, onDragEnter, onDragEnd, add, remove, has };
}
