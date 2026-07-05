import { query, type SqlParam } from "../infrastructure/db.js";
import type { GeoPoint } from "../domain/asset.js";
import type { Observation, ObservationStatus } from "../domain/observation.js";
import type { UUID } from "../domain/user.js";

type ObservationRow = {
  id: string;
  asset_id: string | null;
  reporter_id: string | null;
  image_url: string;
  lng: number | null;
  lat: number | null;
  note: string | null;
  status: ObservationStatus;
  error: string | null;
  created_at: string;
  processed_at: string | null;
};

const COLS = `id, asset_id, reporter_id, image_url,
         ST_X(geom::geometry) AS lng, ST_Y(geom::geometry) AS lat,
         note, status, error, created_at, processed_at`;

function mapObservation(r: ObservationRow): Observation {
  return {
    id: r.id,
    assetId: r.asset_id,
    reporterId: r.reporter_id,
    imageUrl: r.image_url,
    location:
      r.lng !== null && r.lat !== null
        ? { lng: Number(r.lng), lat: Number(r.lat) }
        : null,
    note: r.note,
    status: r.status,
    error: r.error,
    createdAt: r.created_at,
    processedAt: r.processed_at,
  };
}

export interface NewObservation {
  assetId?: UUID | null;
  reporterId?: UUID | null;
  imageUrl: string;
  location?: GeoPoint | null;
  note?: string | null;
}

export async function createObservation(
  input: NewObservation,
): Promise<Observation> {
  const hasGeom = Boolean(input.location);
  const res = await query<ObservationRow>(
    `WITH ins AS (
       INSERT INTO observations (asset_id, reporter_id, image_url, geom, note)
       VALUES ($1, $2, $3,
               CASE WHEN $6 THEN ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography
                    ELSE NULL END,
               $7)
       RETURNING *
     )
     SELECT ${COLS} FROM ins`,
    [
      input.assetId ?? null,
      input.reporterId ?? null,
      input.imageUrl,
      input.location?.lng ?? 0,
      input.location?.lat ?? 0,
      hasGeom,
      input.note ?? null,
    ],
  );
  return mapObservation(res.rows[0]);
}

export async function getObservationById(
  id: UUID,
): Promise<Observation | null> {
  const res = await query<ObservationRow>(
    `SELECT ${COLS} FROM observations WHERE id = $1`,
    [id],
  );
  return res.rows[0] ? mapObservation(res.rows[0]) : null;
}

export async function listObservations(
  opts: {
    assetId?: UUID;
    reporterId?: UUID;
    status?: ObservationStatus;
    limit?: number;
    offset?: number;
  } = {},
): Promise<Observation[]> {
  const conditions: string[] = [];
  const params: SqlParam[] = [];
  if (opts.assetId) {
    params.push(opts.assetId);
    conditions.push(`asset_id = $${params.length}`);
  }
  if (opts.reporterId) {
    params.push(opts.reporterId);
    conditions.push(`reporter_id = $${params.length}`);
  }
  if (opts.status) {
    params.push(opts.status);
    conditions.push(`status = $${params.length}`);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  params.push(opts.limit ?? 50);
  const limitClause = ` LIMIT $${params.length}`;
  params.push(opts.offset ?? 0);
  const offsetClause = ` OFFSET $${params.length}`;
  const res = await query<ObservationRow>(
    `SELECT ${COLS} FROM observations${where}
     ORDER BY created_at DESC${limitClause}${offsetClause}`,
    params,
  );
  return res.rows.map(mapObservation);
}

export async function setObservationStatus(
  id: UUID,
  status: ObservationStatus,
  opts: {
    assetId?: UUID | null;
    error?: string | null;
    processed?: boolean;
  } = {},
): Promise<void> {
  await query(
    `UPDATE observations
     SET status = $2,
         asset_id = COALESCE($3, asset_id),
         error = $4,
         processed_at = CASE WHEN $5 THEN now() ELSE processed_at END
     WHERE id = $1`,
    [
      id,
      status,
      opts.assetId ?? null,
      opts.error ?? null,
      opts.processed ?? false,
    ],
  );
}
