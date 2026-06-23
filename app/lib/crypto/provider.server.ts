import type { MarketsResult } from "./types";
import { createMockProvider } from "./mock.provider.server";
import { createCoinGeckoProvider } from "./coingecko.provider.server";

/**
 * The seam. Every data source implements this; the UI and loader depend only on it.
 * To add Coinbase or any other source: implement `getMarkets`, register it in the
 * factory below, and touch nothing else (see CLAUDE.md §2 "Data provider layer").
 */
export interface CryptoProvider {
  getMarkets(): Promise<MarketsResult>;
}

export type ProviderName = "mock" | "coingecko";

function resolveProviderName(): ProviderName {
  const raw = (process.env.CRYPTO_PROVIDER || "mock").toLowerCase();
  return raw === "coingecko" ? "coingecko" : "mock";
}

export function getCryptoProvider(): CryptoProvider {
  switch (resolveProviderName()) {
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
