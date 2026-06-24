import { describe, expect, it } from "vitest";

import type { CryptoProvider } from "~/lib/crypto/provider.server";
import { createHybridProvider, mergeMarkets } from "~/lib/crypto/hybrid.provider.server";
import type { Coin, MarketsResult } from "~/lib/crypto/types";

function coin(id: string, over: Partial<Coin> = {}): Coin {
  return {
    id,
    symbol: id.slice(0, 3).toUpperCase(),
    name: id,
    priceUsd: 100,
    priceBtc: 0.001,
    change24h: null,
    sparkline: [],
    ...over,
  };
}

function provider(result: MarketsResult | Error): CryptoProvider {
  return {
    getMarkets: async () => {
      if (result instanceof Error) throw result;
      return result;
    },
  };
}

const coinbaseLike: MarketsResult = {
  source: "coinbase",
  coins: [coin("bitcoin", { priceUsd: 60000 }), coin("ethereum", { priceUsd: 3000 })],
};
const coingeckoLike: MarketsResult = {
  source: "coingecko",
  coins: [
    coin("bitcoin", { priceUsd: 59000, change24h: 1.5, sparkline: [1, 2, 3] }),
    coin("ethereum", { priceUsd: 2950, change24h: -2, sparkline: [4, 5, 6] }),
  ],
};

describe("mergeMarkets", () => {
  it("keeps base prices but overlays 24h change + sparkline from the enricher", () => {
    const merged = mergeMarkets(coinbaseLike.coins, coingeckoLike.coins);
    const btc = merged.find((c) => c.id === "bitcoin")!;
    expect(btc.priceUsd).toBe(60000); // Coinbase price wins
    expect(btc.change24h).toBe(1.5); // CoinGecko change
    expect(btc.sparkline).toEqual([1, 2, 3]); // CoinGecko sparkline
  });

  it("leaves a base coin untouched when the enricher has no match", () => {
    const merged = mergeMarkets([coin("solana")], coingeckoLike.coins);
    expect(merged[0].change24h).toBeNull();
    expect(merged[0].sparkline).toEqual([]);
  });
});

describe("createHybridProvider resilience", () => {
  it("merges when both sources succeed", async () => {
    const p = createHybridProvider(provider(coinbaseLike), provider(coingeckoLike));
    const { coins, source } = await p.getMarkets();
    expect(source).toBe("hybrid");
    expect(coins.find((c) => c.id === "bitcoin")!.change24h).toBe(1.5);
    expect(coins.find((c) => c.id === "bitcoin")!.priceUsd).toBe(60000);
  });

  it("falls back to primary-only when the enricher fails", async () => {
    const p = createHybridProvider(provider(coinbaseLike), provider(new Error("cg down")));
    const { coins, source } = await p.getMarkets();
    expect(source).toBe("hybrid");
    expect(coins.find((c) => c.id === "bitcoin")!.change24h).toBeNull(); // degraded, prices intact
    expect(coins.find((c) => c.id === "bitcoin")!.priceUsd).toBe(60000);
  });

  it("falls back to the enricher when the primary fails", async () => {
    const p = createHybridProvider(provider(new Error("cb down")), provider(coingeckoLike));
    const { coins, source } = await p.getMarkets();
    expect(source).toBe("hybrid");
    expect(coins.find((c) => c.id === "bitcoin")!.priceUsd).toBe(59000); // CoinGecko price
  });

  it("throws when both sources fail", async () => {
    const p = createHybridProvider(provider(new Error("cb down")), provider(new Error("cg down")));
    await expect(p.getMarkets()).rejects.toThrow("cb down");
  });
});
