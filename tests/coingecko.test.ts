import { describe, expect, it } from "vitest";

import { normalizeMarkets, type CoinGeckoMarket } from "~/lib/crypto/coingecko.provider.server";

function mkt(over: Partial<CoinGeckoMarket> & { symbol: string }): CoinGeckoMarket {
  return {
    id: over.id ?? over.symbol,
    name: over.name ?? over.symbol,
    current_price: 100,
    price_change_percentage_24h: 0,
    sparkline_in_7d: { price: [1, 2, 3] },
    ...over,
  };
}

const MARKETS: CoinGeckoMarket[] = [
  mkt({ id: "bitcoin", symbol: "btc", name: "Bitcoin", current_price: 50000, price_change_percentage_24h: 1.5 }),
  mkt({ id: "ethereum", symbol: "eth", name: "Ethereum", current_price: 2500, price_change_percentage_24h: -2 }),
  // CoinGecko renamed Polygon's id + display name; we still match by symbol and keep OUR name.
  mkt({ id: "polygon-ecosystem-token", symbol: "pol", name: "POL (ex-MATIC)", current_price: 0.7 }),
  // A coin with no name override — keeps the API name.
  mkt({ id: "shiba-inu", symbol: "shib", name: "Shiba Inu", current_price: 0.00002 }),
];

describe("normalizeMarkets (full catalog, symbol-keyed)", () => {
  it("keys by uppercase symbol and applies our display-name overrides", () => {
    const coins = normalizeMarkets(MARKETS);
    const pol = coins.find((c) => c.id === "POL")!;
    expect(pol.symbol).toBe("POL");
    expect(pol.name).toBe("Polygon"); // override, not "POL (ex-MATIC)"
    expect(coins.find((c) => c.id === "SHIB")!.name).toBe("Shiba Inu"); // no override → API name
  });

  it("returns the whole catalog, not just the default set", () => {
    expect(normalizeMarkets(MARKETS).map((c) => c.id)).toEqual(["BTC", "ETH", "POL", "SHIB"]);
  });

  it("derives the BTC rate from the BTC market", () => {
    const coins = normalizeMarkets(MARKETS);
    expect(coins.find((c) => c.id === "BTC")!.priceBtc).toBe(1);
    expect(coins.find((c) => c.id === "ETH")!.priceBtc).toBeCloseTo(0.05, 6);
  });

  it("preserves a genuine null 24h change", () => {
    const coins = normalizeMarkets([mkt({ symbol: "btc", price_change_percentage_24h: null })]);
    expect(coins[0].change24h).toBeNull();
  });

  it("dedupes a symbol collision to the highest market cap (first wins)", () => {
    const collided = [
      mkt({ id: "bitcoin", symbol: "btc", current_price: 50000 }),
      mkt({ id: "fake", symbol: "btc", current_price: 1 }),
    ];
    const btc = normalizeMarkets(collided).filter((c) => c.id === "BTC");
    expect(btc).toHaveLength(1);
    expect(btc[0].priceUsd).toBe(50000);
  });

  it("down-samples long sparklines", () => {
    const long = Array.from({ length: 168 }, (_, i) => i);
    const coins = normalizeMarkets([mkt({ symbol: "btc", sparkline_in_7d: { price: long } })]);
    expect(coins[0].sparkline.length).toBeLessThanOrEqual(31);
  });
});
