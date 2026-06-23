import { describe, expect, it } from "vitest";

import type { Coin } from "~/lib/crypto/types";
import { filterCoins, moveItem, orderCoins, reconcileOrder } from "~/lib/order";

function coin(id: string, name: string, symbol: string): Coin {
  return { id, name, symbol, priceUsd: 1, priceBtc: 1, change24h: 0, sparkline: [] };
}

describe("reconcileOrder", () => {
  it("keeps saved order, drops missing ids, appends new ones", () => {
    expect(reconcileOrder(["b", "a"], ["a", "b", "c"])).toEqual(["b", "a", "c"]);
  });
  it("drops ids no longer present", () => {
    expect(reconcileOrder(["a", "gone", "b"], ["a", "b"])).toEqual(["a", "b"]);
  });
  it("falls back to id order when nothing saved", () => {
    expect(reconcileOrder([], ["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("moveItem", () => {
  it("moves a dragged id into the target slot", () => {
    expect(moveItem(["a", "b", "c"], "a", "c")).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], "c", "a")).toEqual(["c", "a", "b"]);
  });
  it("is a no-op for same id or unknown ids", () => {
    expect(moveItem(["a", "b"], "a", "a")).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], "x", "a")).toEqual(["a", "b"]);
  });
});

describe("orderCoins", () => {
  it("returns coins in the given id order, skipping unknowns", () => {
    const coins = [coin("a", "A", "A"), coin("b", "B", "B")];
    expect(orderCoins(coins, ["b", "x", "a"]).map((c) => c.id)).toEqual(["b", "a"]);
  });
});

describe("filterCoins", () => {
  const coins = [
    coin("bitcoin", "Bitcoin", "BTC"),
    coin("ethereum", "Ethereum", "ETH"),
    coin("solana", "Solana", "SOL"),
  ];
  it("matches by name (case-insensitive)", () => {
    expect(filterCoins(coins, "eth").map((c) => c.id)).toEqual(["ethereum"]);
  });
  it("matches by symbol", () => {
    expect(filterCoins(coins, "sol").map((c) => c.id)).toEqual(["solana"]);
  });
  it("returns all for an empty query", () => {
    expect(filterCoins(coins, "  ")).toHaveLength(3);
  });
  it("returns none for no match", () => {
    expect(filterCoins(coins, "doge")).toHaveLength(0);
  });
});
