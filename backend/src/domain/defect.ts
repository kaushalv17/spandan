import type { UUID } from "./user.js";

export type Severity = "low" | "medium" | "high";
export const SEVERITIES: readonly Severity[] = ["low", "medium", "high"];

// The unified defect vocabulary shared with the AI model service (Phase 2).
export const UNIFIED_DEFECT_CLASSES = [
  "longitudinal_crack",
  "transverse_crack",
  "alligator_crack",
  "pothole",
  "spallation",
  "exposed_rebar",
  "efflorescence",
  "corrosion_stain",
] as const;

export type DefectType = (typeof UNIFIED_DEFECT_CLASSES)[number];

export type BoundingBox = [number, number, number, number];

export interface Defect {
  id: UUID;
  observationId: UUID;
  assetId: UUID | null;
  defectType: string;
  severity: Severity;
  extentPct: number;
  confidence: number;
  bbox: BoundingBox | null;
  createdAt: string;
}

export interface NewDefect {
  defectType: string;
  severity: Severity;
  extentPct: number;
  confidence: number;
  bbox?: BoundingBox | null;
}
