import type { UUID } from "./user.js";

export type HealthBand = "Healthy" | "Degrading" | "Critical" | "Failure-risk";

export interface HealthRecord {
  id: UUID;
  assetId: UUID;
  observationId: UUID | null;
  shi: number;
  band: HealthBand;
  totalDeduction: number;
  recordedAt: string;
}

export type RiskPriority = "P0" | "P1" | "P2" | "P3";
