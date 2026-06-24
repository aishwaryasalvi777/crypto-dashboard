import { createTtlCache } from "./cache.server";
import type { MarketsResult } from "./types";
import { createMockProvider } from "./mock.provider.server";
import { createCoinGeckoProvider } from "./coingecko.provider.server";
import { createCoinbaseProvider } from "./coinbase.provider.server";

/**
 * The seam. Every data source implements this; the UI and loader depend only on it.
 * To add another source: implement `getMarkets`, register it in the factory below, and
 * touch nothing else (see CLAUDE.md §2 "Data provider layer").
 */
export interface CryptoProvider {
  getMarkets(): Promise<MarketsResult>;
}

export type ProviderName = "mock" | "coinbase" | "coingecko";

/** The provider that will serve the current request — also used to label results/errors. */
export function getActiveProviderName(): ProviderName {
  const raw = (process.env.CRYPTO_PROVIDER || "coinbase").toLowerCase();
  if (raw === "mock") return "mock";
  if (raw === "coingecko") return "coingecko";
  return "coinbase";
}

export function getCryptoProvider(): CryptoProvider {
  switch (getActiveProviderName()) {
    case "coinbase":
      return createCoinbaseProvider({
        baseUrl: process.env.COINBASE_API_BASE || "https://api.coinbase.com",
        apiKey: process.env.COINBASE_API_KEY || undefined,
      });
    case "coingecko":
      return createCoinGeckoProvider({
        baseUrl: process.env.COINGECKO_API_BASE || "https://api.coingecko.com/api/v3",
        apiKey: process.env.COINGECKO_API_KEY || undefined,
      });
    case "mock":
    default:
      return createMockProvider();
  }
}

/** Always-available offline source, used by the dashboard's "Load demo data" fallback. */
export function getMockProvider(): CryptoProvider {
  return createMockProvider();
}

// Short-TTL cache shared across requests/tabs so live endpoints aren't hit on every refresh.
const marketsCache = createTtlCache<MarketsResult>(12_000);

/**
 * Fetch markets through the configured provider, with a short cache + in-flight de-dup. The mock
 * source is uncached (free + deterministic). This is what the loader should call.
 */
export function getMarketsCached(): Promise<MarketsResult> {
  const name = getActiveProviderName();
  const provider = getCryptoProvider();
  if (name === "mock") return provider.getMarkets();
  return marketsCache(name, () => provider.getMarkets());
}
