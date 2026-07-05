import { withTransaction } from "../infrastructure/db.js";
import { logger } from "../infrastructure/logger.js";
import * as observations from "../repositories/observationRepository.js";
import { insertDefects } from "../repositories/defectRepository.js";
import { insertHealth } from "../repositories/healthRepository.js";
import { writeAudit } from "../repositories/auditRepository.js";
import { inferImage } from "../clients/modelServiceClient.js";
import type { NewDefect } from "../domain/defect.js";
import type { HealthBand } from "../domain/health.js";
import { severityFromArea } from "./severity.js";

// Full pipeline for one observation: run inference, persist defects + health,
// and update the observation status. Called by the BullMQ worker.
export async function processObservation(observationId: string): Promise<void> {
  const obs = await observations.getObservationById(observationId);
  if (!obs) throw new Error(`observation ${observationId} not found`);

  await observations.setObservationStatus(observationId, "processing");
  try {
    const result = await inferImage(obs.imageUrl);
    const defects: NewDefect[] = result.detections.map((d) => ({
      defectType: d.label,
      severity: severityFromArea(d.area_fraction),
      extentPct: Math.min(100, d.area_fraction * 100),
      confidence: d.confidence,
      bbox: d.bbox,
    }));

    await withTransaction(async (client) => {
      await insertDefects(client, observationId, obs.assetId, defects);
      if (obs.assetId) {
        await insertHealth(client, {
          assetId: obs.assetId,
          observationId,
          shi: result.health.shi,
          band: result.health.band as HealthBand,
          totalDeduction: result.health.total_deduction,
        });
      }
      await writeAudit(
        {
          action: "observation.processed",
          entityType: "observation",
          entityId: observationId,
          metadata: {
            defects: defects.length,
            shi: result.health.shi,
            band: result.health.band,
          },
        },
        client,
      );
    });

    await observations.setObservationStatus(observationId, "processed", {
      processed: true,
    });
    logger.info(
      { observationId, defects: defects.length, shi: result.health.shi },
      "observation processed",
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    await observations.setObservationStatus(observationId, "failed", {
      error: message,
    });
    throw err;
  }
}
