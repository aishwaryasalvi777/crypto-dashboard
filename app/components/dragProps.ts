import type { DragEvent, HTMLAttributes } from "react";

import type { CardOrder } from "~/hooks/useCardOrder";

/**
 * Native HTML5 drag-and-drop props shared by grid cards and list rows. `onDragOver`/`onDrop`
 * must call preventDefault for a drop target to be valid. Reordering happens on dragEnter so
 * the list animates live as you drag (matching the design).
 */
export function dragProps(
  id: string,
  order: Pick<CardOrder, "onDragStart" | "onDragEnter" | "onDragEnd" | "dragId">,
): HTMLAttributes<HTMLDivElement> & { draggable: true; "data-id": string } {
  const prevent = (e: DragEvent) => e.preventDefault();
  return {
    draggable: true,
    "data-id": id,
    "data-dragging": order.dragId === id ? "true" : undefined,
    onDragStart: (e) => {
      try {
        e.dataTransfer.effectAllowed = "move";
      } catch {
        /* jsdom / unsupported */
      }
      order.onDragStart(id);
    },
    onDragEnter: () => order.onDragEnter(id),
    onDragOver: prevent,
    onDrop: prevent,
    onDragEnd: () => order.onDragEnd(),
  } as HTMLAttributes<HTMLDivElement> & { draggable: true; "data-id": string };
}
