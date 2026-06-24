import type { CryptoProvider } from "./provider.server";
import { BITCOIN_SYMBOL, displayName } from "./coins";
import type { Coin } from "./types";

interface CoinGeckoConfig {
  baseUrl: string;
  apiKey?: string;
}

/** Fields we consume from CoinGecko's `coins/markets` response. */
export interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: { price?: number[] };
}

/** Size of the searchable catalog (top coins by market cap). Covers the long tail a user might
 *  search for while keeping it to one request. */
const PER_PAGE = 250;
/** Cap sparkline points sent to the client (CoinGecko returns ~168 hourly points × 250 coins —
 *  too heavy). ~30 is plenty for a 120px sparkline. */
const SPARK_POINTS = 30;

/**
 * Live data via CoinGecko `coins/markets`, ordered by market cap. Returns the **full top-250 as a
 * searchable catalog** keyed by uppercase symbol (id renames self-heal; ticker collisions resolve
 * to the highest market cap). The client picks which catalog coins to show (the watchlist).
 */
export function createCoinGeckoProvider(config: CoinGeckoConfig): CryptoProvider {
  return {
    async getMarkets() {
      const url = new URL(`${config.baseUrl.replace(/\/$/, "")}/coins/markets`);
      url.searchParams.set("vs_currency", "usd");
      url.searchParams.set("order", "market_cap_desc");
      url.searchParams.set("per_page", String(PER_PAGE));
      url.searchParams.set("page", "1");
      url.searchParams.set("sparkline", "true");
      url.searchParams.set("price_change_percentage", "24h");

      const headers: Record<string, string> = { accept: "application/json" };
      if (config.apiKey) headers["x-cg-demo-api-key"] = config.apiKey;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(
          `Price API returned ${res.status}. Free APIs can rate-limit — retry in a moment.`,
        );
      }

      const data = (await res.json()) as unknown;
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("No data returned from the price API.");
      }

      return { coins: normalizeMarkets(data as CoinGeckoMarket[]), source: "coingecko" as const };
    },
  };
}

/** Down-sample a price series to at most `max` evenly-spaced points. */
function thin(prices: number[], max: number): number[] {
  if (prices.length <= max) return prices;
  const step = prices.length / max;
  const out: number[] = [];
  for (let i = 0; i < max; i++) out.push(prices[Math.floor(i * step)]);
  out.push(prices[prices.length - 1]);
  return out;
}

/**
 * Project the market list onto our `Coin` model: id = uppercase symbol (dedup → highest market cap
 * first), our preferred display name where we have one, BTC rate from the BTC market.
 */
export function normalizeMarkets(markets: CoinGeckoMarket[]): Coin[] {
  const seen = new Set<string>();
  const btcPrice =
    markets.find((m) => (m.symbol || "").toUpperCase() === BITCOIN_SYMBOL)?.current_price ?? null;

  const coins: Coin[] = [];
  for (const m of markets) {
    const symbol = (m.symbol || "").toUpperCase();
    if (!symbol || seen.has(symbol)) continue; // first occurrence = highest market cap
    seen.add(symbol);
    const priceUsd = m.current_price;
    coins.push({
      id: symbol,
      symbol,
      name: displayName(symbol, m.name),
      priceUsd,
      priceBtc: btcPrice && priceUsd ? priceUsd / btcPrice : 0,
      change24h: m.price_change_percentage_24h ?? null,
      sparkline: thin(m.sparkline_in_7d?.price ?? [], SPARK_POINTS),
    });
  }
  return coins;
}
