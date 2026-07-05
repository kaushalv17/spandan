import type { HealthBand } from "./types";

// SHI band thresholds — must mirror the backend health engine (Phase 2/3).
export const CRITICAL_THRESHOLD = 55;

export const HEALTH_BANDS: readonly HealthBand[] = [
  "Healthy",
  "Degrading",
  "Critical",
  "Failure-risk",
];

// Client-side band derivation for arbitrary SHI values (gauges, map colours).
export function bandForShi(shi: number): HealthBand {
  if (shi >= 85) return "Healthy";
  if (shi >= 55) return "Degrading";
  if (shi >= 25) return "Critical";
  return "Failure-risk";
}

export const BAND_COLOR: Record<HealthBand, string> = {
  Healthy: "#16a34a",
  Degrading: "#eab308",
  Critical: "#f97316",
  "Failure-risk": "#dc2626",
};

export const BAND_EMOJI: Record<HealthBand, string> = {
  Healthy: "\uD83D\uDFE2",
  Degrading: "\uD83D\uDFE1",
  Critical: "\uD83D\uDFE0",
  "Failure-risk": "\uD83D\uDD34",
};

export const BAND_DESCRIPTION: Record<HealthBand, string> = {
  Healthy: "Structurally sound",
  Degrading: "Early deterioration",
  Critical: "Needs intervention",
  "Failure-risk": "Imminent failure risk",
};

export function bandColor(band: HealthBand): string {
  return BAND_COLOR[band];
}

export function shiColor(shi: number): string {
  return BAND_COLOR[bandForShi(shi)];
}
