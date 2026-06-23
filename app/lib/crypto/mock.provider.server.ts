import type { CryptoProvider } from "./provider.server";
import { BITCOIN_ID } from "./coins";
import type { Coin } from "./types";

interface CoinSeed {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

const SEEDS: CoinSeed[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin", price: 64250, change24h: 1.8 },
  { id: "ethereum", symbol: "ETH", name: "Ethereum", price: 3420, change24h: 2.4 },
  { id: "solana", symbol: "SOL", name: "Solana", price: 142.5, change24h: -1.2 },
  { id: "ripple", symbol: "XRP", name: "XRP", price: 0.523, change24h: 0.6 },
  { id: "cardano", symbol: "ADA", name: "Cardano", price: 0.452, change24h: -0.8 },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", price: 0.1234, change24h: 3.1 },
  { id: "avalanche-2", symbol: "AVAX", name: "Avalanche", price: 36.8, change24h: -2.1 },
  { id: "chainlink", symbol: "LINK", name: "Chainlink", price: 14.25, change24h: 1.1 },
  { id: "polkadot", symbol: "DOT", name: "Polkadot", price: 6.42, change24h: -0.4 },
  { id: "matic-network", symbol: "MATIC", name: "Polygon", price: 0.712, change24h: 2.2 },
  { id: "litecoin", symbol: "LTC", name: "Litecoin", price: 84.3, change24h: 0.9 },
  { id: "uniswap", symbol: "UNI", name: "Uniswap", price: 7.85, change24h: -1.5 },
];

/** Tiny deterministic PRNG (mulberry32) so mock sparklines are stable across runs/SSR. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSamples(price: number, change24h: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const pts: number[] = [];
  let v = price * (1 - (change24h / 100) * 0.5);
  for (let i = 0; i < 47; i++) {
    v = v * (1 + (rand() - 0.5) * 0.022);
    pts.push(v);
  }
  pts.push(price);
  return pts;
}

export function createMockProvider(): CryptoProvider {
  return {
    async getMarkets() {
      const btc = SEEDS.find((s) => s.id === BITCOIN_ID);
      const btcPrice = btc ? btc.price : null;

      const coins: Coin[] = SEEDS.map((s, i) => ({
        id: s.id,
        symbol: s.symbol,
        name: s.name,
        priceUsd: s.price,
        priceBtc: btcPrice ? s.price / btcPrice : 0,
        change24h: s.change24h,
        sparkline: buildSamples(s.price, s.change24h, i + 1),
      }));

      return { coins, source: "mock" as const };
    },
  };
}
