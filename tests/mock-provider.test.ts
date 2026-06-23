import { describe, expect, it } from "vitest";

import { createMockProvider } from "~/lib/crypto/mock.provider.server";

describe("mock provider", () => {
  it("returns the full tracked coin set with required fields", async () => {
    const { coins, source } = await createMockProvider().getMarkets();
    expect(source).toBe("mock");
    expect(coins.length).toBe(12);
    for (const c of coins) {
      expect(c.id).toBeTruthy();
      expect(c.symbol).toMatch(/^[A-Z]+$/);
      expect(typeof c.priceUsd).toBe("number");
      expect(c.sparkline.length).toBeGreaterThan(1);
    }
  });

  it("derives a BTC rate of 1 for bitcoin and <1 for cheaper coins", async () => {
    const { coins } = await createMockProvider().getMarkets();
    const btc = coins.find((c) => c.id === "bitcoin")!;
    const doge = coins.find((c) => c.id === "dogecoin")!;
    expect(btc.priceBtc).toBe(1);
    expect(doge.priceBtc).toBeGreaterThan(0);
    expect(doge.priceBtc).toBeLessThan(1);
  });

  it("is deterministic across calls", async () => {
    const a = await createMockProvider().getMarkets();
    const b = await createMockProvider().getMarkets();
    expect(a.coins[0].sparkline).toEqual(b.coins[0].sparkline);
  });
});
