// Phase 5: real presigned upload. Presign -> PUT to MinIO -> return public URL.
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";

function authToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("spandan.token");
}

export async function uploadObservationImage(
  file: Blob,
  contentType = "image/jpeg",
): Promise<string> {
  const presignUrl =
    process.env.NEXT_PUBLIC_UPLOAD_URL || `${API_BASE}/uploads/presign`;
  const token = authToken();

  const presign = await fetch(presignUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ contentType }),
  });
  if (!presign.ok) throw new Error(`presign failed: ${presign.status}`);
  const { uploadUrl, objectUrl } = (await presign.json()) as {
    uploadUrl: string;
    objectUrl: string;
  };

  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!put.ok) throw new Error(`upload failed: ${put.status}`);

  return objectUrl; // use as observation.imageUrl
}
