// Pure-TS port of the Phase 2 Python forecaster (ai/spandan_ai/health/forecast.py).
// Kept dependency-free so it is unit-testable without a database.

export const CRITICAL_THRESHOLD = 55;

export interface ForecastResult {
  slopePerDay: number;
  intercept: number;
  currentShi: number;
  threshold: number;
  rulDays: number | null; // null => not trending toward failure
  willFail: boolean;
}

export function linearFit(
  xs: number[],
  ys: number[],
): { slope: number; intercept: number } {
  const n = xs.length;
  if (n !== ys.length || n < 2) {
    throw new Error("need at least two paired points");
  }
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - meanX) ** 2;
    sxy += (xs[i] - meanX) * (ys[i] - meanY);
  }
  if (sxx === 0) {
    throw new Error("all x values are identical; cannot fit a trend");
  }
  const slope = sxy / sxx;
  return { slope, intercept: meanY - slope * meanX };
}

export function forecastRul(
  history: { t: number; shi: number }[],
  threshold = CRITICAL_THRESHOLD,
): ForecastResult | null {
  if (history.length < 2) return null;
  const xs = history.map((h) => h.t);
  const ys = history.map((h) => h.shi);
  const { slope, intercept } = linearFit(xs, ys);
  const lastT = xs[xs.length - 1];
  const current = slope * lastT + intercept;

  let rul: number | null = null;
  if (current <= threshold) {
    rul = 0;
  } else if (slope < 0) {
    rul = Math.max(0, (threshold - intercept) / slope - lastT);
  }

  return {
    slopePerDay: slope,
    intercept,
    currentShi: current,
    threshold,
    rulDays: rul,
    willFail: rul !== null,
  };
}

// Converts stored health rows (absolute timestamps) into day-offsets for fitting.
export function toDayOffsets(
  points: { recordedAt: string; shi: number }[],
): { t: number; shi: number }[] {
  if (points.length === 0) return [];
  const DAY = 86_400_000;
  const t0 = new Date(points[0].recordedAt).getTime();
  return points.map((p) => ({
    t: (new Date(p.recordedAt).getTime() - t0) / DAY,
    shi: p.shi,
  }));
}
