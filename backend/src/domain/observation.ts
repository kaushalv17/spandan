import type { GeoPoint } from "./asset.js";
import type { UUID } from "./user.js";

export type ObservationStatus =
  | "pending"
  | "processing"
  | "processed"
  | "failed";

// Runtime list of statuses (e.g. for zod enums / validation). Keep in sync with
// the ObservationStatus union above.
export const OBSERVATION_STATUSES: readonly ObservationStatus[] = [
  "pending",
  "processing",
  "processed",
  "failed",
];

export interface Observation {
  id: UUID;
  assetId: UUID | null;
  reporterId: UUID | null;
  imageUrl: string;
  location: GeoPoint | null;
  note: string | null;
  status: ObservationStatus;
  error: string | null;
  createdAt: string;
  processedAt: string | null;
}
