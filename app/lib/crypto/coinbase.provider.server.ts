import type { CryptoProvider } from "./provider.server";
import { BITCOIN_SYMBOL, DEFAULT_WATCHLIST, displayName } from "./coins";
import type { Coin } from "./types";

interface CoinbaseConfig {
  baseUrl: string;
  /** Optional — the public exchange-rates endpoint needs no key. Reserved for future
   *  authenticated features. */
  apiKey?: string;
}

/** Shape of Coinbase's `GET /v2/exchange-rates?currency=USD` response. */
interface CoinbaseRatesResponse {
  data?: { currency?: string; rates?: Record<string, string> };
}

export interface CoinbasePrice {
  priceUsd: number;
  priceBtc: number;
}

async function fetchRates(config: CoinbaseConfig): Promise<Record<string, string>> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/v2/exchange-rates?currency=USD`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (config.apiKey) headers["CB-ACCESS-KEY"] = config.apiKey;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Coinbase API returned ${res.status}. It can rate-limit — retry in a moment.`);
  }
  const body = (await res.json()) as CoinbaseRatesResponse;
  const rates = body?.data?.rates;
  if (!rates || typeof rates !== "object") {
    throw new Error("Unexpected response from the Coinbase API.");
  }
  return rates;
}

/**
 * Coinbase price map for every symbol it quotes, keyed by uppercase symbol. Used by the hybrid
 * provider to overlay Coinbase's USD/BTC prices onto the CoinGecko catalog (Coinbase stays the
 * price authority for the coins it quotes — the brief's requirement). rates[SYM] = units of SYM per
 * USD, so `priceUsd = 1/rate` and `priceBtc = rate[BTC]/rate[SYM]`.
 */
export async function loadCoinbasePrices(config: CoinbaseConfig): Promise<Map<string, CoinbasePrice>> {
  return priceMap(await fetchRates(config));
}

export function priceMap(rates: Record<string, string>): Map<string, CoinbasePrice> {
  const btcPerUsd = Number(rates[BITCOIN_SYMBOL]);
  const map = new Map<string, CoinbasePrice>();
  for (const [sym, raw] of Object.entries(rates)) {
    const perUsd = Number(raw);
    if (!Number.isFinite(perUsd) || perUsd <= 0) continue;
    map.set(sym.toUpperCase(), {
      priceUsd: 1 / perUsd,
      priceBtc: Number.isFinite(btcPerUsd) && btcPerUsd > 0 ? btcPerUsd / perUsd : 0,
    });
  }
  return map;
}

/**
 * Standalone Coinbase source (`CRYPTO_PROVIDER=coinbase`): prices the default watchlist from the
 * public exchange-rates endpoint. No 24h change or sparkline (Coinbase's public API has neither).
 */
export function createCoinbaseProvider(config: CoinbaseConfig): CryptoProvider {
  return {
    async getMarkets() {
      const prices = priceMap(await fetchRates(config));
      const coins: Coin[] = DEFAULT_WATCHLIST.flatMap((symbol): Coin[] => {
        const p = prices.get(symbol);
        if (!p) return [];
        return [
          {
            id: symbol,
            symbol,
            name: displayName(symbol, symbol),
            priceUsd: p.priceUsd,
            priceBtc: p.priceBtc,
            change24h: null,
            sparkline: [],
          },
        ];
      });
      return { coins, source: "coinbase" as const };
    },
  };
}
