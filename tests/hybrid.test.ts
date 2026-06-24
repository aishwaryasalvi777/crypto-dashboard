import { describe, expect, it } from "vitest";

import type { CoinbasePrice } from "~/lib/crypto/coinbase.provider.server";
import {
  createHybridProvider,
  defaultFromPrices,
  overlayPrices,
} from "~/lib/crypto/hybrid.provider.server";
import type { Coin, MarketsResult } from "~/lib/crypto/types";

function coin(id: string, over: Partial<Coin> = {}): Coin {
  return {
    id,
    symbol: id,
    name: id,
    priceUsd: 100,
    priceBtc: 0.001,
    change24h: 1,
    sparkline: [1, 2, 3],
    ...over,
  };
}

const catalog: MarketsResult = {
  source: "coingecko",
  coins: [coin("BTC", { priceUsd: 59000 }), coin("ETH", { priceUsd: 2950 }), coin("SHIB")],
};
const cbPrices = new Map<string, CoinbasePrice>([
  ["BTC", { priceUsd: 60000, priceBtc: 1 }],
  ["ETH", { priceUsd: 3000, priceBtc: 0.05 }],
  // No SHIB — Coinbase doesn't quote it.
]);

const ok = <T>(v: T) => () => Promise.resolve(v);
const fail = (msg: string) => () => Promise.reject(new Error(msg));

describe("overlayPrices", () => {
  it("replaces price with Coinbase's where quoted, leaves others untouched", () => {
    const out = overlayPrices(catalog.coins, cbPrices);
    expect(out.find((c) => c.id === "BTC")!.priceUsd).toBe(60000); // Coinbase
    expect(out.find((c) => c.id === "SHIB")!.priceUsd).toBe(100); // CoinGecko kept
    expect(out.find((c) => c.id === "BTC")!.sparkline).toEqual([1, 2, 3]); // charts kept
  });
});

describe("defaultFromPrices", () => {
  it("builds default-watchlist coins from Coinbase prices (no charts)", () => {
    const coins = defaultFromPrices(cbPrices);
    expect(coins.find((c) => c.id === "BTC")!.name).toBe("Bitcoin");
    expect(coins.find((c) => c.id === "BTC")!.change24h).toBeNull();
    expect(coins.find((c) => c.id === "BTC")!.sparkline).toEqual([]);
  });
});

describe("createHybridProvider resilience", () => {
  it("overlays Coinbase prices on the catalog when both succeed", async () => {
    const { coins, source } = await createHybridProvider(ok(catalog), ok(cbPrices)).getMarkets();
    expect(source).toBe("hybrid");
    expect(coins.find((c) => c.id === "BTC")!.priceUsd).toBe(60000);
    expect(coins.find((c) => c.id === "SHIB")!.priceUsd).toBe(100);
  });

  it("returns the catalog with CoinGecko prices when Coinbase fails", async () => {
    const { coins } = await createHybridProvider(ok(catalog), fail("cb down")).getMarkets();
    expect(coins.find((c) => c.id === "BTC")!.priceUsd).toBe(59000); // CoinGecko price
  });

  it("falls back to a Coinbase-priced default set when the catalog fails", async () => {
    const { coins } = await createHybridProvider(fail("cg down"), ok(cbPrices)).getMarkets();
    expect(coins.find((c) => c.id === "BTC")!.priceUsd).toBe(60000);
    expect(coins.every((c) => c.sparkline.length === 0)).toBe(true);
  });

  it("throws when both sources fail", async () => {
    await expect(
      createHybridProvider(fail("cg down"), fail("cb down")).getMarkets(),
    ).rejects.toThrow("cg down");
  });
});
