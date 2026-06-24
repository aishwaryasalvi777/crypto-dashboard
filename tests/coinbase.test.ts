import { describe, expect, it } from "vitest";

import { priceMap } from "~/lib/crypto/coinbase.provider.server";

// rates[SYM] = units of SYM per 1 USD. BTC at $50k => 0.00002; ETH at $2.5k => 0.0004.
const RATES: Record<string, string> = {
  BTC: "0.00002",
  ETH: "0.0004",
  SOL: "0.01",
  EUR: "0.9", // fiat — harmless, ignored by callers that look up crypto symbols
};

describe("priceMap (Coinbase rates)", () => {
  it("derives USD price as 1 / rate, keyed by uppercase symbol", () => {
    const m = priceMap(RATES);
    expect(m.get("BTC")!.priceUsd).toBeCloseTo(50000, 5);
    expect(m.get("ETH")!.priceUsd).toBeCloseTo(2500, 5);
  });

  it("derives the BTC rate as rates[BTC] / rates[SYM]", () => {
    const m = priceMap(RATES);
    expect(m.get("BTC")!.priceBtc).toBe(1);
    expect(m.get("ETH")!.priceBtc).toBeCloseTo(0.05, 6); // $2500 / $50000
  });

  it("falls back to priceBtc 0 when the BTC rate is missing", () => {
    const m = priceMap({ ETH: "0.0004", SOL: "0.01" });
    expect(m.get("ETH")!.priceBtc).toBe(0);
    expect(m.has("BTC")).toBe(false);
  });

  it("skips non-positive / invalid rates", () => {
    const m = priceMap({ BTC: "0.00002", BAD: "0", WORSE: "abc" });
    expect(m.has("BAD")).toBe(false);
    expect(m.has("WORSE")).toBe(false);
  });
});
