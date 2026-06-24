import type { CryptoProvider } from "./provider.server";
import type { CoinbasePrice } from "./coinbase.provider.server";
import { DEFAULT_WATCHLIST, displayName } from "./coins";
import type { Coin, MarketsResult } from "./types";

type GetCatalog = () => Promise<MarketsResult>;
type GetCoinbasePrices = () => Promise<Map<string, CoinbasePrice>>;

/**
 * The default provider. CoinGecko supplies the full searchable **catalog** (top markets, with 24h
 * change + sparkline); Coinbase's prices are **overlaid** for every symbol it quotes, so Coinbase
 * stays the USD/BTC authority for those coins (the brief's requirement) while CoinGecko covers the
 * long tail + chart data.
 *
 * Resilience (`Promise.allSettled`):
 *  - both ok          → catalog with Coinbase prices overlaid
 *  - Coinbase fails   → catalog with CoinGecko prices (still fully usable)
 *  - CoinGecko fails  → Coinbase-priced default watchlist (no catalog/charts, but live prices)
 *  - both fail        → throw (loader shows the error state)
 */
export function createHybridProvider(
  getCatalog: GetCatalog,
  getCoinbasePrices: GetCoinbasePrices,
): CryptoProvider {
  return {
    async getMarkets(): Promise<MarketsResult> {
      const [cat, cb] = await Promise.allSettled([getCatalog(), getCoinbasePrices()]);
      const prices = cb.status === "fulfilled" ? cb.value : null;

      if (cat.status === "fulfilled") {
        const coins = prices ? overlayPrices(cat.value.coins, prices) : cat.value.coins;
        return { coins, source: "hybrid" };
      }
      if (prices) {
        return { coins: defaultFromPrices(prices), source: "hybrid" };
      }
      throw cat.reason instanceof Error ? cat.reason : new Error("Both price sources failed.");
    },
  };
}

/** Replace each catalog coin's USD/BTC price with Coinbase's where Coinbase quotes the symbol. */
export function overlayPrices(catalog: Coin[], prices: Map<string, CoinbasePrice>): Coin[] {
  return catalog.map((coin) => {
    const p = prices.get(coin.symbol);
    return p ? { ...coin, priceUsd: p.priceUsd, priceBtc: p.priceBtc } : coin;
  });
}

/** Fallback when the catalog is unavailable: price the default watchlist from Coinbase alone. */
export function defaultFromPrices(prices: Map<string, CoinbasePrice>): Coin[] {
  return DEFAULT_WATCHLIST.flatMap((symbol): Coin[] => {
    const p = prices.get(symbol);
    if (!p) return [];
    return [
      {
        id: symbol,
        symbol,
        name: displayName(symbol, symbol),
        priceUsd: p.priceUsd,
        priceBtc: p.priceBtc,
        change24h: null,
        sparkline: [],
      },
    ];
  });
}
