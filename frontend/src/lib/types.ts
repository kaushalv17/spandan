// Frontend mirror of the Phase 3 backend domain + API response shapes.
// Kept in sync with backend/src/domain/*.ts and the route handlers.

export type Role = "citizen" | "authority" | "admin";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  createdAt: string;
}

export interface AuthResult {
  token: string;
  user: User;
}

export type AssetType = "road" | "bridge";

export interface GeoPoint {
  lng: number;
  lat: number;
}

export interface Asset {
  id: string;
  externalRef: string | null;
  name: string;
  assetType: AssetType;
  location: GeoPoint;
  address: string | null;
  importance: number;
  createdBy: string | null;
  createdAt: string;
}

export type HealthBand = "Healthy" | "Degrading" | "Critical" | "Failure-risk";

export interface HealthRecord {
  id: string;
  assetId: string;
  observationId: string | null;
  shi: number;
  band: HealthBand;
  totalDeduction: number;
  recordedAt: string;
}

export type RiskPriority = "P0" | "P1" | "P2" | "P3";

export interface RiskAssessment {
  priority: RiskPriority;
  riskScore: number;
  urgencyDays: number | null;
  reasons: string[];
}

export type Severity = "low" | "medium" | "high";

export interface Defect {
  id: string;
  observationId: string;
  assetId: string | null;
  defectType: string;
  severity: Severity;
  extentPct: number;
  confidence: number;
  bbox: [number, number, number, number] | null;
  createdAt: string;
}

export type ObservationStatus =
  | "pending"
  | "processing"
  | "processed"
  | "failed";

export interface Observation {
  id: string;
  assetId: string | null;
  reporterId: string | null;
  imageUrl: string;
  location: GeoPoint | null;
  note: string | null;
  status: ObservationStatus;
  error: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface HealthPoint {
  recordedAt: string;
  shi: number;
  band: string;
}

export interface PassportForecast {
  rulDays: number | null;
  slopePerDay: number;
  projectedShi: number;
}

export interface AssetPassport {
  asset: Asset;
  currentHealth: HealthRecord | null;
  history: HealthPoint[];
  forecast: PassportForecast | null;
  risk: RiskAssessment | null;
  recentDefects: Defect[];
}
