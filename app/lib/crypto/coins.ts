/**
 * The 12 coins the dashboard tracks. `id` is the CoinGecko id; `symbol` is the ticker
 * Coinbase uses in its exchange-rates response. The order here is the default card order
 * before the user reorders. Adding a coin is a one-line change.
 */
export interface CoinMeta {
  id: string;
  symbol: string;
  name: string;
}

export const COINS: CoinMeta[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "matic-network", symbol: "MATIC", name: "Polygon" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
  { id: "uniswap", symbol: "UNI", name: "Uniswap" },
];

export const COIN_IDS = COINS.map((c) => c.id);

export const BITCOIN_ID = "bitcoin";
export const BITCOIN_SYMBOL = "BTC";
