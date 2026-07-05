import type { Severity } from "../domain/defect.js";

// Map a detection's bbox area fraction to a defect severity band. Pure and
// dependency-free so it can be unit-tested without env/DB side effects.
export function severityFromArea(areaFraction: number): Severity {
  const pct = areaFraction * 100;
  if (pct >= 15) return "high";
  if (pct >= 5) return "medium";
  return "low";
}
