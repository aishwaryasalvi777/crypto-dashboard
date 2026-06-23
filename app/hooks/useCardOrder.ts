import { useCallback, useEffect, useRef, useState } from "react";

import { moveItem, reconcileOrder } from "~/lib/order";
import { useLocalStorage } from "./useLocalStorage";

const ORDER_STORAGE_KEY = "cd_order";

export interface CardOrder {
  /** Current ordered list of coin ids. */
  order: string[];
  /** Id of the card currently being dragged, or null. */
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
}

/**
 * Owns drag-and-drop card ordering and its localStorage persistence. Reconciles the saved
 * order against the live coin ids whenever the data set changes, so manual order survives
 * refreshes (CLAUDE.md §2). Pure logic lives in `lib/order.ts`; this is the React shell.
 */
export function useCardOrder(ids: string[]): CardOrder {
  const [order, setOrder] = useLocalStorage<string[]>(ORDER_STORAGE_KEY, ids, (raw) => {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : undefined;
  });
  const [dragId, setDragId] = useState<string | null>(null);
  const idsKey = ids.join(",");
  const lastReconciled = useRef<string>("");

  // Reconcile whenever the coin set changes (new/removed coins).
  useEffect(() => {
    if (lastReconciled.current === idsKey) return;
    lastReconciled.current = idsKey;
    setOrder((prev) => reconcileOrder(prev, ids));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const onDragStart = useCallback((id: string) => setDragId(id), []);
  const onDragEnd = useCallback(() => setDragId(null), []);

  const onDragEnter = useCallback(
    (targetId: string) => {
      setDragId((current) => {
        if (current && current !== targetId) {
          setOrder((prev) => moveItem(prev, current, targetId));
        }
        return current;
      });
    },
    [setOrder],
  );

  return { order, dragId, onDragStart, onDragEnter, onDragEnd };
}
