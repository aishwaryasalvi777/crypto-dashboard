import { describe, expect, it } from "vitest";

import {
  addToWatchlist,
  defaultWatchlist,
  reconcileWatchlist,
  removeFromWatchlist,
} from "~/lib/watchlist";

describe("watchlist", () => {
  it("defaultWatchlist returns a non-empty fresh copy", () => {
    const a = defaultWatchlist();
    const b = defaultWatchlist();
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b); // new array each call
    expect(a).toContain("BTC");
  });

  it("add appends when absent and is a no-op when present", () => {
    expect(addToWatchlist(["BTC"], "ETH")).toEqual(["BTC", "ETH"]);
    expect(addToWatchlist(["BTC", "ETH"], "ETH")).toEqual(["BTC", "ETH"]);
  });

  it("remove drops the id", () => {
    expect(removeFromWatchlist(["BTC", "ETH", "SOL"], "ETH")).toEqual(["BTC", "SOL"]);
    expect(removeFromWatchlist(["BTC"], "ZZZ")).toEqual(["BTC"]);
  });

  it("reconcile keeps catalog members in order and drops the rest", () => {
    expect(reconcileWatchlist(["BTC", "GONE", "ETH"], ["ETH", "BTC", "SOL"])).toEqual(["BTC", "ETH"]);
  });

  it("reconcile can empty the watchlist (user removed everything stays removed)", () => {
    expect(reconcileWatchlist([], ["BTC", "ETH"])).toEqual([]);
  });
});
