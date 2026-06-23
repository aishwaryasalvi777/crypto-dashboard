import type { CryptoProvider } from "./provider.server";
import { BITCOIN_SYMBOL, COINS } from "./coins";
import type { Coin } from "./types";

interface CoinbaseConfig {
  baseUrl: string;
  /** Optional — the public exchange-rates endpoint needs no key. Reserved for future
   *  authenticated features (balances/orders). */
  apiKey?: string;
}

/** Shape of Coinbase's `GET /v2/exchange-rates?currency=USD` response. */
interface CoinbaseRatesResponse {
  data?: { currency?: string; rates?: Record<string, string> };
}

/**
 * Live data via Coinbase's public `exchange-rates` endpoint — the source named in the brief.
 * One keyless request returns the rate of every currency per 1 USD, which yields each coin's
 * USD price and BTC rate. Coinbase's public API does not expose 24h change or a price history,
 * so those fields are left empty and the UI degrades gracefully (see CLAUDE.md trade-offs).
 *
 * rates[SYM] = units of SYM per 1 USD, therefore:
 *   priceUsd(coin) = 1 / rates[SYM]
 *   priceBtc(coin) = rates[BTC] / rates[SYM]
 */
export function createCoinbaseProvider(config: CoinbaseConfig): CryptoProvider {
  return {
    async getMarkets() {
      const url = `${config.baseUrl.replace(/\/$/, "")}/v2/exchange-rates?currency=USD`;
      const headers: Record<string, string> = { accept: "application/json" };
      if (config.apiKey) headers["CB-ACCESS-KEY"] = config.apiKey;

      const res = await fetch(url, { headers });
      if (!res.ok) {
        throw new Error(
          `Coinbase API returned ${res.status}. It can rate-limit — retry in a moment.`,
        );
      }

      const body = (await res.json()) as CoinbaseRatesResponse;
      const rates = body?.data?.rates;
      if (!rates || typeof rates !== "object") {
        throw new Error("Unexpected response from the Coinbase API.");
      }

      return { coins: normalizeCoinbase(rates), source: "coinbase" as const };
    },
  };
}

export function normalizeCoinbase(rates: Record<string, string>): Coin[] {
  const btcPerUsd = Number(rates[BITCOIN_SYMBOL]);

  return COINS.flatMap((meta): Coin[] => {
    const perUsd = Number(rates[meta.symbol]);
    // Skip coins Coinbase doesn't quote rather than render a broken card.
    if (!Number.isFinite(perUsd) || perUsd <= 0) return [];

    const priceUsd = 1 / perUsd;
    const priceBtc = Number.isFinite(btcPerUsd) && btcPerUsd > 0 ? btcPerUsd / perUsd : 0;

    return [
      {
        id: meta.id,
        symbol: meta.symbol,
        name: meta.name,
        priceUsd,
        priceBtc,
        change24h: null, // not provided by the public exchange-rates endpoint
        sparkline: [], // no price history available
      },
    ];
  });
}
