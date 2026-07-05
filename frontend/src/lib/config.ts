// Base URL of the Spandan backend API (Phase 3). Overridable per-environment.
export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1"
).replace(/\/$/, "");

// Must match backend env ASSET_MATCH_RADIUS_M (nearest-asset binding radius).
export const ASSET_MATCH_RADIUS_M = 60;

// Default map centre (approx. geographic centre of India) until assets load.
export const DEFAULT_MAP_CENTER: [number, number] = [22.9734, 78.6569];
export const DEFAULT_MAP_ZOOM = 5;
