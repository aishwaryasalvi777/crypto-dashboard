import { describe, expect, it } from "vitest";

import { DEFAULT_WATCHLIST, NAME_OVERRIDES } from "~/lib/crypto/coins";

/**
 * Live guard against coin-symbol drift. Skipped by default (no network in `npm test`); run with
 * `npm run check:coins` (sets CHECK_COINS=1). It hits both live APIs and fails loudly if any
 * tracked coin's symbol stops resolving — so drift surfaces at build/CI time instead of as a
 * silently graph-less card in production. See README "Known limitation & planned hardening".
 */
const RUN = process.env.CHECK_COINS === "1";

describe.skipIf(!RUN)("coin resolution guard (live APIs)", () => {
  const label = (s: string) => `${NAME_OVERRIDES[s] ?? s} (${s})`;

  it("every default-watchlist symbol is quoted by Coinbase", async () => {
    const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD");
    const rates: Record<string, string> = (await res.json()).data.rates;
    const missing = DEFAULT_WATCHLIST.filter((s) => !(s in rates)).map(label);
    expect(missing).toEqual([]);
  }, 20000);

  it("every default-watchlist symbol resolves in CoinGecko's top markets", async () => {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1",
    );
    const markets: Array<{ symbol: string }> = await res.json();
    const symbols = new Set(markets.map((m) => (m.symbol || "").toUpperCase()));
    const missing = DEFAULT_WATCHLIST.filter((s) => !symbols.has(s)).map(label);
    expect(missing).toEqual([]);
  }, 20000);
});
