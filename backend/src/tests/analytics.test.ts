import { calculateVolatility, calculateCorrelation, calculatePriceChangePercent } from "../utils/analytics";

import logger from "../utils/logger";

describe("Analytics utilities", () => {
  beforeAll(() => logger.info("Testing Analytics utilities..."));
  describe("calculateVolatility", () => {
    test("returns 0 for single price point", () => {
      expect(calculateVolatility([50000])).toBe(0);
    });

    test("returns 0 for empty array", () => {
      expect(calculateVolatility([])).toBe(0);
    });

    test("returns positive value for varying prices", () => {
      const prices = [45000, 46000, 44500, 47000, 45500, 46800, 44000];
      const vol = calculateVolatility(prices);
      expect(vol).toBeGreaterThan(0);
      expect(typeof vol).toBe("number");
      expect(isFinite(vol)).toBe(true);
    });

    test("returns 0 for constant prices (no variance)", () => {
      const prices = [50000, 50000, 50000, 50000];
      expect(calculateVolatility(prices)).toBe(0);
    });

    test("handles prices with zero — skips zero-price entries", () => {
      // First price 0 makes the first return 0 via guard
      const vol = calculateVolatility([0, 50000, 51000]);
      expect(isFinite(vol)).toBe(true);
    });
  });

  describe("calculateCorrelation", () => {
    test("returns 1 for perfectly correlated series", () => {
      const s1 = [100, 110, 120, 130, 140];
      const s2 = [200, 220, 240, 260, 280];
      const corr = calculateCorrelation(s1, s2);
      expect(corr).toBeCloseTo(1, 2);
    });

    test("returns negative value for inversely correlated series on returns", () => {
      // Alternating up/down pattern produces genuinely negative return correlation
      const s1 = [100, 120, 100, 120, 100, 120];
      const s2 = [100, 80,  100, 80,  100, 80];
      const corr = calculateCorrelation(s1, s2);
      expect(corr).toBeLessThan(0);
      expect(corr).toBeGreaterThanOrEqual(-1);
    });

    test("returns 0 for series shorter than 2", () => {
      expect(calculateCorrelation([100], [200])).toBe(0);
      expect(calculateCorrelation([], [])).toBe(0);
    });

    test("result is clamped to [-1, 1]", () => {
      const s1 = [100, 200, 150, 300, 250];
      const s2 = [110, 210, 140, 290, 260];
      const corr = calculateCorrelation(s1, s2);
      expect(corr).toBeGreaterThanOrEqual(-1);
      expect(corr).toBeLessThanOrEqual(1);
    });

    test("handles mismatched series lengths", () => {
      const s1 = [100, 110, 120, 130];
      const s2 = [200, 220];
      const corr = calculateCorrelation(s1, s2);
      expect(isFinite(corr)).toBe(true);
    });
  });

  describe("calculatePriceChangePercent", () => {
    test("calculates positive change correctly", () => {
      expect(calculatePriceChangePercent(50000, 55000)).toBeCloseTo(10, 2);
    });

    test("calculates negative change correctly", () => {
      expect(calculatePriceChangePercent(50000, 45000)).toBeCloseTo(-10, 2);
    });

    test("returns 0 when old price is 0 (division guard)", () => {
      expect(calculatePriceChangePercent(0, 50000)).toBe(0);
    });

    test("returns 0 for no change", () => {
      expect(calculatePriceChangePercent(50000, 50000)).toBe(0);
    });
  });
});
