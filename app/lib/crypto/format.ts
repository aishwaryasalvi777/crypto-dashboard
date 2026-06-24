/**
 * Pure formatting + sparkline geometry. No DOM, no React — all heavily unit-tested.
 * Components import these to turn raw `Coin` numbers into display strings / SVG points.
 */

/** Format a USD price: 2 decimals at/above $1, up to 6 for sub-dollar coins. */
export function formatUsd(n: number): string {
  if (n == null || Number.isNaN(n)) return "$0.00";
  const opts: Intl.NumberFormatOptions =
    n >= 1
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 6 };
  return "$" + n.toLocaleString("en-US", opts);
}

/** Format a BTC-denominated rate: 4 decimals at/above 1, 6 below. */
export function formatBtc(n: number): string {
  if (!n || Number.isNaN(n)) return "₿ 0";
  return "₿ " + (n >= 1 ? n.toFixed(4) : n.toFixed(6));
}

/** Format a signed 24h percentage change, e.g. "+1.80%" / "-1.20%". */
export function formatChange(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  return (v >= 0 ? "+" : "") + v.toFixed(2) + "%";
}

export function isPositive(change: number): boolean {
  return change >= 0;
}

export interface SparkGeometry {
  /** Polyline points for the trend line. Empty string when there is not enough data. */
  line: string;
  /** Polygon points for the shaded area beneath the line. */
  area: string;
}

const SPARK_W = 120;
const SPARK_H = 36;
const SPARK_PAD = 3;
const SPARK_MAX_POINTS = 48;

/**
 * Build SVG point strings for a sparkline over a 120×36 viewBox.
 * Down-samples long series so the path stays light. Returns empty strings
 * for series with fewer than two points (caller renders nothing).
 */
export function buildSparkline(prices: number[]): SparkGeometry {
  if (!prices || prices.length < 2) return { line: "", area: "" };

  const step = Math.max(1, Math.ceil(prices.length / SPARK_MAX_POINTS));
  const pts = prices.filter((_, i) => i % step === 0);
  if (pts.length < 2) return { line: "", area: "" };

  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1;

  const coords = pts.map((p, i) => {
    const x = (i / (pts.length - 1)) * SPARK_W;
    const y = SPARK_H - SPARK_PAD - ((p - min) / range) * (SPARK_H - SPARK_PAD * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const line = coords.join(" ");
  const area = `0,${SPARK_H} ${line} ${SPARK_W},${SPARK_H}`;
  return { line, area };
}

/** Deterministic avatar background color, indexed by position to match the design palette. */
const PALETTE = [
  "#f7931a", "#627eea", "#9945ff", "#23292f", "#0033ad", "#c2a633",
  "#e84142", "#2a5ada", "#e6007a", "#8247e5", "#345d9d", "#ff007a",
];

export function avatarColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export function avatarLetter(symbol: string): string {
  return (symbol || "?").charAt(0).toUpperCase();
}

/**
 * Real coin logo URL, keyed by ticker, from the jsdelivr-hosted `cryptocurrency-icons`
 * package (durable CDN, color SVGs). Provider-independent — works for Coinbase data too,
 * which carries no image field. Falls back to the colored initial avatar on load error.
 */
export function coinIconUrl(symbol: string): string {
  return `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color/${symbol.toLowerCase()}.svg`;
}
