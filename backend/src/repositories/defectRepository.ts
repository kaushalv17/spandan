import type { PoolClient } from "pg";
import { query } from "../infrastructure/db.js";
import type {
  BoundingBox,
  Defect,
  NewDefect,
  Severity,
} from "../domain/defect.js";
import type { UUID } from "../domain/user.js";

type DefectRow = {
  id: string;
  observation_id: string;
  asset_id: string | null;
  defect_type: string;
  severity: Severity;
  extent_pct: number;
  confidence: number;
  bbox: BoundingBox | null;
  created_at: string;
};

function mapDefect(r: DefectRow): Defect {
  return {
    id: r.id,
    observationId: r.observation_id,
    assetId: r.asset_id,
    defectType: r.defect_type,
    severity: r.severity,
    extentPct: Number(r.extent_pct),
    confidence: Number(r.confidence),
    bbox: r.bbox,
    createdAt: r.created_at,
  };
}

// Inserted within the same transaction that writes the health record.
export async function insertDefects(
  client: PoolClient,
  observationId: UUID,
  assetId: UUID | null,
  defects: readonly NewDefect[],
): Promise<Defect[]> {
  const created: Defect[] = [];
  for (const d of defects) {
    const res = await client.query<DefectRow>(
      `INSERT INTO defects
         (observation_id, asset_id, defect_type, severity, extent_pct, confidence, bbox)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        observationId,
        assetId,
        d.defectType,
        d.severity,
        d.extentPct,
        d.confidence,
        d.bbox ? JSON.stringify(d.bbox) : null,
      ],
    );
    created.push(mapDefect(res.rows[0]));
  }
  return created;
}

export async function listDefectsByObservation(
  observationId: UUID,
): Promise<Defect[]> {
  const res = await query<DefectRow>(
    `SELECT * FROM defects WHERE observation_id = $1 ORDER BY extent_pct DESC`,
    [observationId],
  );
  return res.rows.map(mapDefect);
}

export async function listDefectsByAsset(
  assetId: UUID,
  limit = 100,
): Promise<Defect[]> {
  const res = await query<DefectRow>(
    `SELECT * FROM defects WHERE asset_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [assetId, limit],
  );
  return res.rows.map(mapDefect);
}
