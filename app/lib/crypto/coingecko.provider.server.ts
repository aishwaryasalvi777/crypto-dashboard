import type { CryptoProvider } from "./provider.server";
import { BITCOIN_ID, COIN_IDS } from "./coins";
import type { Coin } from "./types";

interface CoinGeckoConfig {
  baseUrl: string;
  apiKey?: string;
}

/** Shape of the fields we consume from CoinGecko's `coins/markets` response. */
interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: { price?: number[] };
}

/**
 * Live data via CoinGecko `coins/markets`: one keyless request returns name, symbol,
 * USD price, 24h change, and the 7-day sparkline for every tracked coin. The BTC rate
 * is derived from the bitcoin row. See README "Data fetching" and CLAUDE.md trade-offs.
 */
export function createCoinGeckoProvider(config: CoinGeckoConfig): CryptoProvider {
  return {
    async getMarkets() {
      const url = new URL(`${config.baseUrl.replace(/\/$/, "")}/coins/markets`);
      url.searchParams.set("vs_currency", "usd");
      url.searchParams.set("ids", COIN_IDS.join(","));
      url.searchParams.set("order", "market_cap_desc");
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

      return { coins: normalize(data as CoinGeckoMarket[]), source: "coingecko" as const };
    },
  };
}

export function normalize(raw: CoinGeckoMarket[]): Coin[] {
  const btc = raw.find((c) => c.id === BITCOIN_ID);
  const btcPrice = btc ? btc.current_price : null;

  return raw.map((c) => {
    const priceUsd = c.current_price;
    return {
      id: c.id,
      symbol: (c.symbol || "").toUpperCase(),
      name: c.name,
      priceUsd,
      priceBtc: btcPrice && priceUsd ? priceUsd / btcPrice : 0,
      change24h: c.price_change_percentage_24h ?? 0,
      sparkline: c.sparkline_in_7d?.price ?? [],
    };
  });
}
