import * as assets from "../repositories/assetRepository.js";
import {
  healthHistory,
  latestHealth,
} from "../repositories/healthRepository.js";
import { listDefectsByAsset } from "../repositories/defectRepository.js";
import { forecastRul, toDayOffsets } from "./forecastService.js";
import { computeRisk, type RiskAssessment } from "./riskService.js";
import { AppError } from "../http/errors.js";
import type { Asset } from "../domain/asset.js";
import type { Defect } from "../domain/defect.js";
import type { HealthRecord } from "../domain/health.js";
import type { UUID } from "../domain/user.js";

export interface AssetPassport {
  asset: Asset;
  currentHealth: HealthRecord | null;
  history: { recordedAt: string; shi: number; band: string }[];
  forecast: {
    rulDays: number | null;
    slopePerDay: number;
    projectedShi: number;
  } | null;
  risk: RiskAssessment | null;
  recentDefects: Defect[];
}

// The "Structural Passport" for an asset: identity + current SHI + trajectory +
// failure forecast + maintenance risk + recent defects, assembled in one call.
export async function getAssetPassport(assetId: UUID): Promise<AssetPassport> {
  const asset = await assets.getAssetById(assetId);
  if (!asset) throw new AppError(404, "asset not found");

  const [current, history, recentDefects] = await Promise.all([
    latestHealth(assetId),
    healthHistory(assetId, 100),
    listDefectsByAsset(assetId, 20),
  ]);

  const offsets = toDayOffsets(
    history.map((h) => ({ recordedAt: h.recordedAt, shi: h.shi })),
  );
  const forecast = forecastRul(offsets);

  let risk: RiskAssessment | null = null;
  if (current) {
    risk = computeRisk({
      shi: current.shi,
      band: current.band,
      rulDays: forecast?.rulDays ?? null,
      importance: asset.importance,
    });
  }

  return {
    asset,
    currentHealth: current,
    history: history.map((h) => ({
      recordedAt: h.recordedAt,
      shi: h.shi,
      band: h.band,
    })),
    forecast: forecast
      ? {
          rulDays: forecast.rulDays,
          slopePerDay: forecast.slopePerDay,
          projectedShi: forecast.currentShi,
        }
      : null,
    risk,
    recentDefects,
  };
}
