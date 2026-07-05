import { query, type SqlParam } from "../infrastructure/db.js";
import type { Asset, AssetType, GeoPoint } from "../domain/asset.js";
import type { UUID } from "../domain/user.js";

type AssetRow = {
  id: string;
  external_ref: string | null;
  name: string;
  asset_type: AssetType;
  lng: number;
  lat: number;
  address: string | null;
  importance: number;
  created_by: string | null;
  created_at: string;
};

const COLS = `id, external_ref, name, asset_type,
         ST_X(geom::geometry) AS lng, ST_Y(geom::geometry) AS lat,
         address, importance, created_by, created_at`;

function mapAsset(r: AssetRow): Asset {
  return {
    id: r.id,
    externalRef: r.external_ref,
    name: r.name,
    assetType: r.asset_type,
    location: { lng: Number(r.lng), lat: Number(r.lat) },
    address: r.address,
    importance: r.importance,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

export interface NewAsset {
  externalRef?: string | null;
  name: string;
  assetType: AssetType;
  location: GeoPoint;
  address?: string | null;
  importance?: number;
  createdBy?: UUID | null;
}

export async function createAsset(input: NewAsset): Promise<Asset> {
  const res = await query<AssetRow>(
    `WITH ins AS (
       INSERT INTO assets
         (external_ref, name, asset_type, geom, address, importance, created_by)
       VALUES ($1, $2, $3,
               ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
               $6, $7, $8)
       RETURNING *
     )
     SELECT ${COLS} FROM ins`,
    [
      input.externalRef ?? null,
      input.name,
      input.assetType,
      input.location.lng,
      input.location.lat,
      input.address ?? null,
      input.importance ?? 3,
      input.createdBy ?? null,
    ],
  );
  return mapAsset(res.rows[0]);
}

export async function getAssetById(id: UUID): Promise<Asset | null> {
  const res = await query<AssetRow>(
    `SELECT ${COLS} FROM assets WHERE id = $1`,
    [id],
  );
  return res.rows[0] ? mapAsset(res.rows[0]) : null;
}

export async function listAssets(
  opts: { assetType?: AssetType; limit?: number; offset?: number } = {},
): Promise<Asset[]> {
  const conditions: string[] = [];
  const params: SqlParam[] = [];
  if (opts.assetType) {
    params.push(opts.assetType);
    conditions.push(`asset_type = $${params.length}`);
  }
  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  params.push(opts.limit ?? 50);
  const limitClause = ` LIMIT $${params.length}`;
  params.push(opts.offset ?? 0);
  const offsetClause = ` OFFSET $${params.length}`;
  const res = await query<AssetRow>(
    `SELECT ${COLS} FROM assets${where}
     ORDER BY created_at DESC${limitClause}${offsetClause}`,
    params,
  );
  return res.rows.map(mapAsset);
}

// Nearest asset within maxMeters of a point, using the spatial GiST index.
export async function findNearestAssetId(
  point: GeoPoint,
  maxMeters: number,
): Promise<UUID | null> {
  const origin = `ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography`;
  const res = await query<{ id: string }>(
    `SELECT id FROM assets
     WHERE ST_DWithin(geom, ${origin}, $3)
     ORDER BY geom <-> ${origin}
     LIMIT 1`,
    [point.lng, point.lat, maxMeters],
  );
  return res.rows[0]?.id ?? null;
}
