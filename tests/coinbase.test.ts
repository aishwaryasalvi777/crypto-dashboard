import { describe, expect, it } from "vitest";

import { normalizeCoinbase } from "~/lib/crypto/coinbase.provider.server";

// rates[SYM] = units of SYM per 1 USD. BTC at $50k => 0.00002; ETH at $2.5k => 0.0004.
const RATES: Record<string, string> = {
  BTC: "0.00002",
  ETH: "0.0004",
  SOL: "0.01",
};

describe("normalizeCoinbase", () => {
  it("derives USD price as 1 / rate", () => {
    const coins = normalizeCoinbase(RATES);
    const btc = coins.find((c) => c.id === "bitcoin")!;
    const eth = coins.find((c) => c.id === "ethereum")!;
    expect(btc.priceUsd).toBeCloseTo(50000, 5);
    expect(eth.priceUsd).toBeCloseTo(2500, 5);
  });

  it("derives the BTC rate as rates[BTC] / rates[SYM]", () => {
    const coins = normalizeCoinbase(RATES);
    expect(coins.find((c) => c.id === "bitcoin")!.priceBtc).toBe(1);
    // ETH $2500 / BTC $50000 = 0.05 BTC
    expect(coins.find((c) => c.id === "ethereum")!.priceBtc).toBeCloseTo(0.05, 6);
  });

  it("marks 24h change and sparkline as unavailable", () => {
    const eth = normalizeCoinbase(RATES).find((c) => c.id === "ethereum")!;
    expect(eth.change24h).toBeNull();
    expect(eth.sparkline).toEqual([]);
  });

  it("skips coins Coinbase does not quote", () => {
    const ids = normalizeCoinbase(RATES).map((c) => c.id);
    expect(ids).toEqual(["bitcoin", "ethereum", "solana"]);
    expect(ids).not.toContain("dogecoin");
  });
});
