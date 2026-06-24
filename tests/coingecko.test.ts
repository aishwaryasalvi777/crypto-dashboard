import { describe, expect, it } from "vitest";

import { normalize } from "~/lib/crypto/coingecko.provider.server";

const BTC = {
  id: "bitcoin",
  symbol: "btc",
  name: "Bitcoin",
  current_price: 50000,
  price_change_percentage_24h: 1.5,
  sparkline_in_7d: { price: [1, 2, 3] },
};

describe("coingecko normalize", () => {
  it("uppercases symbol and derives the BTC rate from the bitcoin row", () => {
    const [btc, eth] = normalize([
      BTC,
      {
        id: "ethereum",
        symbol: "eth",
        name: "Ethereum",
        current_price: 2500,
        price_change_percentage_24h: -2,
        sparkline_in_7d: { price: [4, 5, 6] },
      },
    ]);
    expect(btc.symbol).toBe("BTC");
    expect(btc.priceBtc).toBe(1);
    expect(eth.priceBtc).toBeCloseTo(0.05, 6);
  });

  it("preserves a genuine null 24h change (does not coerce to 0)", () => {
    const [coin] = normalize([{ ...BTC, price_change_percentage_24h: null }]);
    expect(coin.change24h).toBeNull();
  });

  it("keeps a real numeric change", () => {
    const [coin] = normalize([BTC]);
    expect(coin.change24h).toBe(1.5);
  });

  it("defaults a missing sparkline to an empty array", () => {
    const [coin] = normalize([{ ...BTC, sparkline_in_7d: undefined }]);
    expect(coin.sparkline).toEqual([]);
  });
});
