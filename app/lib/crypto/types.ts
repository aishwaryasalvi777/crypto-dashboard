/**
 * Domain model — the contract every data provider must satisfy and the only crypto type
 * the UI knows about. Raw numbers only; all display formatting happens in `format.ts`
 * (see CLAUDE.md §2: "numbers in the model, strings at the edge").
 */
export interface Coin {
  /** Stable provider id, used as the drag/persistence key (e.g. "bitcoin"). */
  id: string;
  /** Uppercase ticker (e.g. "BTC"). */
  symbol: string;
  /** Display name (e.g. "Bitcoin"). */
  name: string;
  /** Current price in USD. */
  priceUsd: number;
  /** Price expressed in BTC (priceUsd / bitcoinPriceUsd). 1 for BTC itself. */
  priceBtc: number;
  /**
   * 24h price change as a percentage (e.g. -1.2 means -1.2%), or `null` when the
   * source doesn't expose it (e.g. Coinbase's public exchange-rates endpoint).
   */
  change24h: number | null;
  /** 7-day price samples, oldest → newest, for the sparkline. Empty when unavailable. */
  sparkline: number[];
}

/** Result envelope returned to the loader so the UI can distinguish data from a soft failure. */
export interface MarketsResult {
  coins: Coin[];
  /** Source that produced the data, surfaced for debugging / the UI. */
  source: "mock" | "coingecko" | "coinbase";
}
