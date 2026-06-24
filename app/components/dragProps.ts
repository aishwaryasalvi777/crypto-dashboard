import type { DragEvent, HTMLAttributes } from "react";

/** Drag handlers shared by grid cards and list rows (provided by `useWatchlist`). */
export interface DragControls {
  dragId: string | null;
  onDragStart: (id: string) => void;
  onDragEnter: (id: string) => void;
  onDragEnd: () => void;
}

/**
 * Native HTML5 drag-and-drop props for reordering. `onDragOver`/`onDrop` must call preventDefault
 * for a drop target to be valid. Reordering happens on dragEnter so the list animates live.
 */
export function dragProps(
  id: string,
  drag: DragControls,
): HTMLAttributes<HTMLDivElement> & { draggable: true; "data-id": string } {
  const prevent = (e: DragEvent) => e.preventDefault();
  return {
    draggable: true,
    "data-id": id,
    "data-dragging": drag.dragId === id ? "true" : undefined,
    onDragStart: (e) => {
      try {
        e.dataTransfer.effectAllowed = "move";
      } catch {
        /* jsdom / unsupported */
      }
      drag.onDragStart(id);
    },
    onDragEnter: () => drag.onDragEnter(id),
    onDragOver: prevent,
    onDrop: prevent,
    onDragEnd: () => drag.onDragEnd(),
  } as HTMLAttributes<HTMLDivElement> & { draggable: true; "data-id": string };
}
