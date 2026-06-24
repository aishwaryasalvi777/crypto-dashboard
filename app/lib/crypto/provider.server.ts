import { createTtlCache } from "./cache.server";
import type { MarketsResult } from "./types";
import { createCoinGeckoProvider } from "./coingecko.provider.server";
import { createCoinbaseProvider, loadCoinbasePrices } from "./coinbase.provider.server";
import { createHybridProvider } from "./hybrid.provider.server";

/**
 * The seam. Every data source implements this; the UI and loader depend only on it.
 * To add another source: implement `getMarkets`, register it in the factory below, and
 * touch nothing else (see CLAUDE.md §2 "Data provider layer").
 */
export interface CryptoProvider {
  getMarkets(): Promise<MarketsResult>;
}

export type ProviderName = "coinbase" | "coingecko" | "hybrid";

/** The provider that will serve the current request — also used to label results/errors. */
export function getActiveProviderName(): ProviderName {
  const raw = (process.env.CRYPTO_PROVIDER || "hybrid").toLowerCase();
  if (raw === "coingecko") return "coingecko";
  if (raw === "coinbase") return "coinbase";
  return "hybrid";
}

function coinbaseConfig() {
  return {
    baseUrl: process.env.COINBASE_API_BASE || "https://api.coinbase.com",
    apiKey: process.env.COINBASE_API_KEY || undefined,
  };
}

function coingeckoConfig() {
  return {
    baseUrl: process.env.COINGECKO_API_BASE || "https://api.coingecko.com/api/v3",
    apiKey: process.env.COINGECKO_API_KEY || undefined,
  };
}

export function getCryptoProvider(): CryptoProvider {
  switch (getActiveProviderName()) {
    case "coinbase":
      return createCoinbaseProvider(coinbaseConfig());
    case "coingecko":
      return createCoinGeckoProvider(coingeckoConfig());
    case "hybrid":
    default: {
      // CoinGecko = full searchable catalog (+ charts); Coinbase prices overlaid where quoted.
      const coingecko = createCoinGeckoProvider(coingeckoConfig());
      return createHybridProvider(
        () => coingecko.getMarkets(),
        () => loadCoinbasePrices(coinbaseConfig()),
      );
    }
  }
}

// Short-TTL cache shared across requests/tabs so live endpoints aren't hit on every refresh.
const marketsCache = createTtlCache<MarketsResult>(12_000);

/**
 * Fetch markets through the configured live provider, with a short cache + in-flight de-dup.
 * This is what the loader should call.
 */
export function getMarketsCached(): Promise<MarketsResult> {
  const name = getActiveProviderName();
  const provider = getCryptoProvider();
  return marketsCache(name, () => provider.getMarkets());
}
