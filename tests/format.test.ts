import { describe, expect, it } from "vitest";

import {
  avatarColor,
  avatarLetter,
  buildSparkline,
  formatBtc,
  formatChange,
  formatUsd,
  isPositive,
} from "~/lib/crypto/format";

describe("formatUsd", () => {
  it("uses 2 decimals at or above $1 with thousands separators", () => {
    expect(formatUsd(64250)).toBe("$64,250.00");
    expect(formatUsd(1)).toBe("$1.00");
  });

  it("uses up to 6 decimals for sub-dollar prices", () => {
    expect(formatUsd(0.1234)).toBe("$0.1234");
    expect(formatUsd(0.523)).toBe("$0.523");
  });

  it("handles invalid input", () => {
    expect(formatUsd(NaN)).toBe("$0.00");
  });
});

describe("formatBtc", () => {
  it("uses 4 decimals at or above 1 BTC", () => {
    expect(formatBtc(1.23456)).toBe("₿ 1.2346");
  });
  it("uses 6 decimals below 1 BTC", () => {
    expect(formatBtc(0.0532)).toBe("₿ 0.053200");
  });
  it("renders zero for falsy rates", () => {
    expect(formatBtc(0)).toBe("₿ 0");
  });
});

describe("formatChange", () => {
  it("prefixes a sign", () => {
    expect(formatChange(1.8)).toBe("+1.80%");
    expect(formatChange(-1.2)).toBe("-1.20%");
    expect(formatChange(0)).toBe("+0.00%");
  });
});

describe("isPositive", () => {
  it("treats zero as positive", () => {
    expect(isPositive(0)).toBe(true);
    expect(isPositive(-0.1)).toBe(false);
  });
});

describe("buildSparkline", () => {
  it("returns empty geometry for too-few points", () => {
    expect(buildSparkline([])).toEqual({ line: "", area: "" });
    expect(buildSparkline([1])).toEqual({ line: "", area: "" });
  });

  it("builds a polyline within the 120x36 viewBox", () => {
    const { line, area } = buildSparkline([1, 2, 3, 4, 5]);
    const points = line.split(" ").map((p) => p.split(",").map(Number));
    expect(points.length).toBe(5);
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(120);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(36);
    }
    expect(area.startsWith("0,36")).toBe(true);
    expect(area.endsWith("120,36")).toBe(true);
  });

  it("down-samples long series", () => {
    const long = Array.from({ length: 168 }, (_, i) => i);
    const { line } = buildSparkline(long);
    expect(line.split(" ").length).toBeLessThanOrEqual(48);
  });
});

describe("avatar helpers", () => {
  it("cycles palette colors by index", () => {
    expect(avatarColor(0)).toBe(avatarColor(12));
    expect(avatarColor(0)).not.toBe(avatarColor(1));
  });
  it("takes the first letter, uppercased", () => {
    expect(avatarLetter("btc")).toBe("B");
    expect(avatarLetter("")).toBe("?");
  });
});
