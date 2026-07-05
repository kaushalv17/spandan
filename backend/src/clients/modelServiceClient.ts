import { env } from "../config/env.js";
import type { Severity } from "../domain/defect.js";
import type { HealthBand } from "../domain/health.js";

export interface InferDetection {
  label: string;
  confidence: number;
  bbox: [number, number, number, number];
  area_fraction: number;
}

export interface ShiPayload {
  shi: number;
  band: HealthBand;
  emoji: string;
  total_deduction: number;
  contributions: { type: string; deduction: number }[];
}

export interface InferResult {
  detections: InferDetection[];
  health: ShiPayload;
}

export interface DefectInput {
  type: string;
  severity: Severity;
  extent_pct: number;
  confidence?: number;
}

async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// Fetches the stored image and forwards it to the Phase 2 FastAPI /infer
// endpoint as multipart/form-data. Keeps the backend free of an S3 SDK: any
// reachable image URL (MinIO presigned, CDN, etc.) works.
export async function inferImage(imageUrl: string): Promise<InferResult> {
  return withTimeout(async (signal) => {
    const imgRes = await fetch(imageUrl, { signal });
    if (!imgRes.ok) {
      throw new Error(`failed to fetch observation image (${imgRes.status})`);
    }
    const blob = await imgRes.blob();
    const form = new FormData();
    const filename = imageUrl.split("/").pop() || "image.jpg";
    form.append("file", blob, filename);
    const res = await fetch(`${env.AI_SERVICE_URL}/infer`, {
      method: "POST",
      body: form,
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`model /infer failed (${res.status}): ${text}`);
    }
    return (await res.json()) as InferResult;
  });
}

// Direct SHI computation for manually-entered defects (authority workflows).
export async function computeShiRemote(
  defects: DefectInput[],
): Promise<ShiPayload> {
  return withTimeout(async (signal) => {
    const res = await fetch(`${env.AI_SERVICE_URL}/shi`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ defects }),
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`model /shi failed (${res.status}): ${text}`);
    }
    return (await res.json()) as ShiPayload;
  });
}

export async function pingModelService(): Promise<boolean> {
  try {
    const res = await fetch(`${env.AI_SERVICE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
