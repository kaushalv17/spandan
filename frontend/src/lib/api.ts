import { API_BASE_URL } from "./config";
import type {
  Asset,
  AssetPassport,
  AssetType,
  AuthResult,
  Defect,
  HealthRecord,
  Observation,
  ObservationStatus,
  User,
} from "./types";

const TOKEN_KEY = "spandan.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  } catch {
    throw new ApiError(
      0,
      "Network error — check your connection or that the API server is running.",
    );
  }

  const text = await res.text();
  const data: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const record = (data ?? {}) as Record<string, unknown>;
    const message =
      (typeof record.error === "string" && record.error) ||
      (typeof record.message === "string" && record.message) ||
      res.statusText ||
      "Request failed";
    throw new ApiError(res.status, String(message), record.details);
  }

  return data as T;
}

function queryString(
  params: Record<string, string | number | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") q.set(key, String(value));
  }
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

// ---- Auth ----
export function register(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<AuthResult> {
  return request<AuthResult>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(email: string, password: string): Promise<AuthResult> {
  return request<AuthResult>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function me(): Promise<{ user: User }> {
  return request<{ user: User }>("/auth/me");
}

// ---- Assets ----
export function listAssets(
  params: { assetType?: AssetType; limit?: number; offset?: number } = {},
): Promise<{ assets: Asset[] }> {
  return request<{ assets: Asset[] }>(`/assets${queryString(params)}`);
}

export function getAssetPassport(id: string): Promise<AssetPassport> {
  return request<AssetPassport>(`/assets/${id}`);
}

export function getAssetHistory(
  id: string,
  limit = 100,
): Promise<{ assetId: string; history: HealthRecord[] }> {
  return request<{ assetId: string; history: HealthRecord[] }>(
    `/assets/${id}/history${queryString({ limit })}`,
  );
}

export function createAsset(input: {
  name: string;
  assetType: AssetType;
  location: { lng: number; lat: number };
  address?: string;
  importance?: number;
  externalRef?: string;
}): Promise<{ asset: Asset }> {
  return request<{ asset: Asset }>("/assets", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// ---- Observations ----
export function submitObservation(input: {
  imageUrl: string;
  location?: { lng: number; lat: number };
  assetId?: string;
  note?: string;
}): Promise<{ observation: Observation }> {
  return request<{ observation: Observation }>("/observations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function listObservations(
  params: {
    assetId?: string;
    status?: ObservationStatus;
    limit?: number;
    offset?: number;
  } = {},
): Promise<{ observations: Observation[] }> {
  return request<{ observations: Observation[] }>(
    `/observations${queryString(params)}`,
  );
}

export function getObservation(
  id: string,
): Promise<{ observation: Observation; defects: Defect[] }> {
  return request<{ observation: Observation; defects: Defect[] }>(
    `/observations/${id}`,
  );
}
