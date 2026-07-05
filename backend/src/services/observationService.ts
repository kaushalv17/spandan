import { env } from "../config/env.js";
import * as assets from "../repositories/assetRepository.js";
import * as observations from "../repositories/observationRepository.js";
import { writeAudit } from "../repositories/auditRepository.js";
import { enqueueInference } from "../infrastructure/queue.js";
import type { GeoPoint } from "../domain/asset.js";
import type { Observation, ObservationStatus } from "../domain/observation.js";
import type { UUID } from "../domain/user.js";

export interface SubmitObservationInput {
  reporterId: UUID;
  imageUrl: string;
  location?: GeoPoint | null;
  assetId?: UUID | null;
  note?: string | null;
}

export async function submitObservation(
  input: SubmitObservationInput,
): Promise<Observation> {
  // Bind to the explicit asset, else the nearest asset within the match radius.
  let assetId = input.assetId ?? null;
  if (!assetId && input.location) {
    assetId = await assets.findNearestAssetId(
      input.location,
      env.ASSET_MATCH_RADIUS_M,
    );
  }
  const obs = await observations.createObservation({
    reporterId: input.reporterId,
    imageUrl: input.imageUrl,
    location: input.location ?? null,
    assetId,
    note: input.note ?? null,
  });
  await enqueueInference({ observationId: obs.id });
  await writeAudit({
    actorId: input.reporterId,
    action: "observation.submit",
    entityType: "observation",
    entityId: obs.id,
    metadata: { assetId },
  });
  return obs;
}

export async function listObservations(opts: {
  assetId?: UUID;
  reporterId?: UUID;
  status?: ObservationStatus;
  limit?: number;
  offset?: number;
}): Promise<Observation[]> {
  return observations.listObservations(opts);
}

export async function getObservation(id: UUID): Promise<Observation | null> {
  return observations.getObservationById(id);
}
