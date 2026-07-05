export interface CapturedImage {
  dataUrl: string;
  width: number;
  height: number;
  bytes: number;
}

// Downscale + re-encode a captured photo to a compact JPEG data URL so it can be
// queued offline and submitted as the observation `imageUrl`. The Phase 3 backend
// validates imageUrl with z.string().url(), which accepts data: URLs, keeping the
// local prototype fully functional end-to-end.
//
// Phase 5 will replace this with a presigned MinIO/S3 upload (see uploadImage
// below), at which point the returned https URL is sent instead of the data URL.
export async function fileToCompactDataUrl(
  file: Blob,
  maxDim = 1024,
  quality = 0.7,
): Promise<CapturedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Image processing is not supported in this browser.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return {
    dataUrl,
    width,
    height,
    bytes: Math.round((dataUrl.length * 3) / 4),
  };
}

// Upload abstraction. When NEXT_PUBLIC_UPLOAD_URL is configured (Phase 5), the
// blob is POSTed there and the returned public URL is used. Otherwise we fall
// back to an inline data URL so the prototype works with the Phase 3 backend as-is.
export async function uploadObservationImage(file: Blob): Promise<string> {
  const uploadUrl = process.env.NEXT_PUBLIC_UPLOAD_URL;
  if (uploadUrl) {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(uploadUrl, { method: "POST", body: form });
    if (!res.ok) throw new Error("Image upload failed.");
    const data = (await res.json()) as { url?: string };
    if (!data.url) throw new Error("Upload service did not return a URL.");
    return data.url;
  }
  const { dataUrl } = await fileToCompactDataUrl(file);
  return dataUrl;
}
