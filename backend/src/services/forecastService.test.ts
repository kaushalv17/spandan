import { describe, expect, it } from "vitest";
import {
  CRITICAL_THRESHOLD,
  forecastRul,
  linearFit,
  toDayOffsets,
} from "./forecastService.js";

describe("linearFit", () => {
  it("recovers a known line", () => {
    const { slope, intercept } = linearFit([0, 1, 2, 3], [100, 90, 80, 70]);
    expect(slope).toBeCloseTo(-10, 6);
    expect(intercept).toBeCloseTo(100, 6);
  });

  it("rejects fewer than two points", () => {
    expect(() => linearFit([1], [2])).toThrow();
  });

  it("rejects identical x values", () => {
    expect(() => linearFit([2, 2, 2], [1, 2, 3])).toThrow();
  });
});

describe("forecastRul", () => {
  it("returns null for insufficient history", () => {
    expect(forecastRul([{ t: 0, shi: 90 }])).toBeNull();
  });

  it("projects days until the SHI crosses the critical threshold", () => {
    // 100 at day 0, -1/day => reaches 55 at day 45; RUL = 45 - lastT(3) = 42
    const result = forecastRul([
      { t: 0, shi: 100 },
      { t: 1, shi: 99 },
      { t: 2, shi: 98 },
      { t: 3, shi: 97 },
    ]);
    expect(result).not.toBeNull();
    expect(result!.threshold).toBe(CRITICAL_THRESHOLD);
    expect(result!.rulDays).toBeCloseTo(42, 6);
    expect(result!.willFail).toBe(true);
  });

  it("reports RUL 0 when already below threshold", () => {
    const result = forecastRul([
      { t: 0, shi: 50 },
      { t: 1, shi: 48 },
    ]);
    expect(result!.rulDays).toBe(0);
  });

  it("does not forecast failure for a stable/improving trend", () => {
    const result = forecastRul([
      { t: 0, shi: 80 },
      { t: 1, shi: 82 },
      { t: 2, shi: 84 },
    ]);
    expect(result!.rulDays).toBeNull();
    expect(result!.willFail).toBe(false);
  });
});

describe("toDayOffsets", () => {
  it("converts timestamps to day offsets from the first point", () => {
    const points = [
      { recordedAt: "2026-01-01T00:00:00.000Z", shi: 90 },
      { recordedAt: "2026-01-11T00:00:00.000Z", shi: 80 },
    ];
    const offsets = toDayOffsets(points);
    expect(offsets[0].t).toBe(0);
    expect(offsets[1].t).toBeCloseTo(10, 6);
    expect(offsets[1].shi).toBe(80);
  });
});
