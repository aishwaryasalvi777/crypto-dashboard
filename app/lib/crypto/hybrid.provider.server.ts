import type { CryptoProvider } from "./provider.server";
import type { Coin, MarketsResult } from "./types";

/**
 * Combine two sources to get the best of both: the `primary` (Coinbase) is the authority for
 * price + BTC rate (the brief's required Coinbase data), enriched with the `enricher`'s
 * (CoinGecko's) 24h change + 7-day sparkline. Behind the same `CryptoProvider` seam, so the UI
 * is unchanged.
 *
 * Resilience (`Promise.allSettled`):
 *  - both ok        → merged (Coinbase prices + CoinGecko charts)
 *  - enricher fails → primary only (badge/sparkline degrade, prices still shown)
 *  - primary fails  → enricher only (CoinGecko also has price + BTC)
 *  - both fail      → throw (loader shows the error state)
 */
export function createHybridProvider(
  primary: CryptoProvider,
  enricher: CryptoProvider,
): CryptoProvider {
  return {
    async getMarkets(): Promise<MarketsResult> {
      const [base, extra] = await Promise.allSettled([
        primary.getMarkets(),
        enricher.getMarkets(),
      ]);

      if (base.status === "fulfilled" && extra.status === "fulfilled") {
        return { coins: mergeMarkets(base.value.coins, extra.value.coins), source: "hybrid" };
      }
      if (base.status === "fulfilled") {
        return { coins: base.value.coins, source: "hybrid" };
      }
      if (extra.status === "fulfilled") {
        return { coins: extra.value.coins, source: "hybrid" };
      }
      throw base.reason instanceof Error
        ? base.reason
        : new Error("Both price sources failed.");
    },
  };
}

/**
 * Use `base` (price authority) as the canonical list, overlaying each coin's `change24h` and
 * `sparkline` from the matching `enrich` coin (by id). Coins absent from `enrich` keep their own
 * values (e.g. Coinbase's null/empty), so the badge/sparkline simply don't render for them.
 */
export function mergeMarkets(base: Coin[], enrich: Coin[]): Coin[] {
  const byId = new Map(enrich.map((c) => [c.id, c]));
  return base.map((coin) => {
    const extra = byId.get(coin.id);
    if (!extra) return coin;
    return { ...coin, change24h: extra.change24h, sparkline: extra.sparkline };
  });
}
