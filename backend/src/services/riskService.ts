import type { HealthBand, RiskPriority } from "../domain/health.js";

// Turns a current health band + failure forecast + civic importance into a
// maintenance priority (P0..P3) and a continuous risk score for ranking.
// Pure and deterministic: unit-tested without any I/O.

export interface RiskInput {
  shi: number;
  band: HealthBand;
  rulDays: number | null; // from the forecaster; null = not trending to failure
  importance: number; // 1..5
}

export interface RiskAssessment {
  priority: RiskPriority;
  riskScore: number; // 0..100
  urgencyDays: number | null;
  reasons: string[];
}

// Priority ladder, low -> high urgency.
const LEVELS: RiskPriority[] = ["P3", "P2", "P1", "P0"];

const BAND_BASE: Record<HealthBand, number> = {
  Healthy: 0,
  Degrading: 1,
  Critical: 2,
  "Failure-risk": 3,
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(v, hi));
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

export function computeRisk(input: RiskInput): RiskAssessment {
  const reasons: string[] = [];
  let level = BAND_BASE[input.band];
  reasons.push(`Band ${input.band} sets base ${LEVELS[level]}`);

  // Forecast urgency escalation.
  if (input.rulDays !== null) {
    if (input.rulDays <= 7) {
      level += 2;
      reasons.push("Projected failure within 7 days (+2)");
    } else if (input.rulDays <= 30) {
      level += 1;
      reasons.push("Projected failure within 30 days (+1)");
    } else if (input.rulDays <= 90) {
      reasons.push("Projected failure within 90 days (watch)");
    }
  }

  // Civic importance adjustment.
  if (input.importance >= 5) {
    level += 1;
    reasons.push("Critical lifeline asset (+1)");
  } else if (input.importance <= 2 && level > 0) {
    level -= 1;
    reasons.push("Low-importance asset (-1)");
  }

  level = clamp(level, 0, LEVELS.length - 1);
  const priority = LEVELS[level];

  // Continuous score for ordering assets within the same priority.
  const conditionScore = 100 - clamp(input.shi, 0, 100); // worse SHI => higher
  const urgencyScore =
    input.rulDays === null ? 0 : Math.max(0, 40 - Math.min(input.rulDays, 40));
  const importanceScore = ((clamp(input.importance, 1, 5) - 1) / 4) * 20;
  const riskScore = clamp(
    0.5 * conditionScore + urgencyScore + importanceScore,
    0,
    100,
  );

  return {
    priority,
    riskScore: round2(riskScore),
    urgencyDays: input.rulDays,
    reasons,
  };
}
