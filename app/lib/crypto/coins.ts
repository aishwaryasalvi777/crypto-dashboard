/**
 * Coin identity & the default watchlist.
 *
 * Across the whole app a coin's identity is its **uppercase symbol** (`Coin.id === symbol`). It's
 * the universal key both live APIs share (Coinbase exchange-rates and CoinGecko markets), it's what
 * the watchlist stores in localStorage, and it never depends on a provider's internal id (so a
 * CoinGecko id rename like `matic-network` → `polygon-ecosystem-token` can't break us).
 *
 * `DEFAULT_WATCHLIST` is what a brand-new user sees before customizing. `NAME_OVERRIDES` lets us
 * show our preferred display name instead of the API's (e.g. CoinGecko calls POL "POL (ex-MATIC)").
 * Users can search the full top-market catalog and add/remove coins — see `lib/watchlist.ts`.
 */
export const DEFAULT_WATCHLIST = [
  "BTC", "ETH", "SOL", "XRP", "ADA", "DOGE", "AVAX", "LINK", "DOT", "POL", "LTC", "UNI",
];

export const NAME_OVERRIDES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  XRP: "XRP",
  ADA: "Cardano",
  DOGE: "Dogecoin",
  AVAX: "Avalanche",
  LINK: "Chainlink",
  DOT: "Polkadot",
  POL: "Polygon",
  LTC: "Litecoin",
  UNI: "Uniswap",
};

export const BITCOIN_SYMBOL = "BTC";

export function displayName(symbol: string, apiName: string): string {
  return NAME_OVERRIDES[symbol] ?? apiName;
}
