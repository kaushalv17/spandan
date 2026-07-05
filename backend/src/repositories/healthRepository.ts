import type { PoolClient } from "pg";
import { query } from "../infrastructure/db.js";
import type { HealthBand, HealthRecord } from "../domain/health.js";
import type { UUID } from "../domain/user.js";

type HealthRow = {
  id: string;
  asset_id: string;
  observation_id: string | null;
  shi: number;
  band: HealthBand;
  total_deduction: number;
  recorded_at: string;
};

function mapHealth(r: HealthRow): HealthRecord {
  return {
    id: r.id,
    assetId: r.asset_id,
    observationId: r.observation_id,
    shi: Number(r.shi),
    band: r.band,
    totalDeduction: Number(r.total_deduction),
    recordedAt: r.recorded_at,
  };
}

export async function insertHealth(
  client: PoolClient,
  input: {
    assetId: UUID;
    observationId: UUID | null;
    shi: number;
    band: HealthBand;
    totalDeduction: number;
  },
): Promise<HealthRecord> {
  const res = await client.query<HealthRow>(
    `INSERT INTO health_history
       (asset_id, observation_id, shi, band, total_deduction)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      input.assetId,
      input.observationId,
      input.shi,
      input.band,
      input.totalDeduction,
    ],
  );
  return mapHealth(res.rows[0]);
}

export async function latestHealth(
  assetId: UUID,
): Promise<HealthRecord | null> {
  const res = await query<HealthRow>(
    `SELECT * FROM health_history WHERE asset_id = $1
     ORDER BY recorded_at DESC LIMIT 1`,
    [assetId],
  );
  return res.rows[0] ? mapHealth(res.rows[0]) : null;
}

export async function healthHistory(
  assetId: UUID,
  limit = 100,
): Promise<HealthRecord[]> {
  const res = await query<HealthRow>(
    `SELECT * FROM health_history WHERE asset_id = $1
     ORDER BY recorded_at ASC LIMIT $2`,
    [assetId, limit],
  );
  return res.rows.map(mapHealth);
}
