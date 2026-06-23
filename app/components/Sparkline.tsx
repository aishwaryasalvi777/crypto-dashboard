import { useMemo } from "react";

import { buildSparkline } from "~/lib/crypto/format";

interface SparklineProps {
  prices: number[];
  color: string;
  width: number;
  height: number;
  /** Render the shaded area under the line (grid cards only). */
  withArea?: boolean;
}

/** 7-day trend sparkline over a fixed 120×36 viewBox, stretched to the given size. */
export function Sparkline({ prices, color, width, height, withArea = false }: SparklineProps) {
  const { line, area } = useMemo(() => buildSparkline(prices), [prices]);
  if (!line) return <svg width={width} height={height} aria-hidden />;

  return (
    <svg
      viewBox="0 0 120 36"
      preserveAspectRatio="none"
      style={{ width, height, overflow: "visible", flex: "none" }}
      aria-hidden
    >
      {withArea && <polygon points={area} fill={color} opacity={0.12} />}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
