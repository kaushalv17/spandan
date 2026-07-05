import type { UUID } from "./user.js";

export type AssetType = "road" | "bridge";
export const ASSET_TYPES: readonly AssetType[] = ["road", "bridge"];

export interface GeoPoint {
  lng: number;
  lat: number;
}

export interface Asset {
  id: UUID;
  externalRef: string | null;
  name: string;
  assetType: AssetType;
  location: GeoPoint;
  address: string | null;
  /** Civic importance 1 (minor) .. 5 (critical lifeline). */
  importance: number;
  createdBy: UUID | null;
  createdAt: string;
}
