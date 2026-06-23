import type { Coin } from "./crypto/types";

/**
 * Reconcile a saved order (array of coin ids) against the current coin set:
 * keep known ids in their saved position, drop ids that disappeared, and append
 * any new ids at the end. Lets the user's manual order survive data refreshes.
 */
export function reconcileOrder(savedOrder: string[], ids: string[]): string[] {
  const idSet = new Set(ids);
  const order = savedOrder.filter((id) => idSet.has(id));
  const seen = new Set(order);
  for (const id of ids) {
    if (!seen.has(id)) order.push(id);
  }
  return order;
}

/** Move `dragId` to occupy `targetId`'s slot, shifting the rest. Returns a new array. */
export function moveItem(order: string[], dragId: string, targetId: string): string[] {
  if (dragId === targetId) return order;
  const from = order.indexOf(dragId);
  const to = order.indexOf(targetId);
  if (from < 0 || to < 0) return order;
  const next = order.slice();
  next.splice(from, 1);
  next.splice(to, 0, dragId);
  return next;
}

/** Order coins by an id list, skipping ids with no matching coin. */
export function orderCoins(coins: Coin[], order: string[]): Coin[] {
  const byId = new Map(coins.map((c) => [c.id, c]));
  return order.map((id) => byId.get(id)).filter((c): c is Coin => Boolean(c));
}

/** Filter coins by a case-insensitive match on name or symbol. */
export function filterCoins(coins: Coin[], query: string): Coin[] {
  const q = query.trim().toLowerCase();
  if (!q) return coins;
  return coins.filter(
    (c) => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q),
  );
}
