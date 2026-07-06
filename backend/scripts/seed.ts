/* Phase 7 seed: authority user + 4 assets mapped to graded demo images so the
   dashboard shows one asset in each SHI band (healthy/degrading/critical/failure).
   Images are uploaded to MinIO so the worker fetches locally (no external 404s).
   Run:  $env:API_BASE="http://localhost:8080/api/v1"; npm run seed */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Load backend/.env into process.env (no dotenv dependency).
try {
  const txt = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
} catch {
  // ignore
}

const API = process.env.API_BASE || "http://localhost:8080/api/v1";
const S3_ENDPOINT = process.env.S3_ENDPOINT || "http://localhost:9000";
const S3_BUCKET = process.env.S3_BUCKET || "spandan-observations";
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || `${S3_ENDPOINT}/${S3_BUCKET}`;

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "spandan",
    secretAccessKey: process.env.S3_SECRET_KEY || "spandanminio",
  },
});

async function call(path: string, opts: RequestInit = {}, token?: string) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(`${path} -> ${res.status} ${text}`);
  return body;
}

async function promoteToAuthority(email: string) {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("DATABASE_URL not set (checked .env)");
  const client = new pg.Client({ connectionString: cs });
  await client.connect();
  const r = await client.query(
    "UPDATE users SET role = 'authority' WHERE email = $1",
    [email],
  );
  await client.end();
  if (r.rowCount === 0) throw new Error(`no user with email ${email} to promote`);
}

async function uploadDemoImage(fileName: string): Promise<string> {
  const localPath = resolve(process.cwd(), "..", "demo-assets", fileName);
  const body = readFileSync(localPath);
  const key = `observations/demo/${Date.now()}-${fileName}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: "image/jpeg",
    }),
  );
  return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}

// Each asset uses a distinct graded image so the board shows all four bands.
const ASSETS = [
  { name: "NH-48 Flyover Deck",   assetType: "bridge", location: { lng: 77.1000, lat: 28.5562 }, importance: 5, img: "asset_failure.jpg" },    // 🔴
  { name: "Yamuna Rail Bridge",   assetType: "bridge", location: { lng: 77.2400, lat: 28.6500 }, importance: 5, img: "asset_critical.jpg" },   // 🟠
  { name: "Ring Road Segment 12", assetType: "road",   location: { lng: 77.2090, lat: 28.6139 }, importance: 4, img: "asset_degrading.jpg" },  // 🟡
  { name: "Outer Ring Rd KM-34",  assetType: "road",   location: { lng: 77.1800, lat: 28.5000 }, importance: 3, img: "asset_healthy.jpg" },    // 🟢
];

async function main() {
  const email = `authority+${Date.now()}@spandan.gov.in`;
  const password = "Spandan@12345";

  await call("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, fullName: "Demo Authority" }),
  });
  console.log("seed: registered", email);

  await promoteToAuthority(email);
  console.log("seed: promoted to authority");

  const login = await call("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const token = login.token;
  if (!token) throw new Error(`no token in login response: ${JSON.stringify(login)}`);

  const created: Array<{ asset: any; a: (typeof ASSETS)[number] }> = [];
  for (const a of ASSETS) {
    const { asset } = await call(
      "/assets",
      {
        method: "POST",
        body: JSON.stringify({
          name: a.name,
          assetType: a.assetType,
          location: a.location,
          importance: a.importance,
        }),
      },
      token,
    );
    created.push({ asset, a });
    console.log("seed: asset", asset.id, a.name);
  }

  for (const { a } of created) {
    const imageUrl = await uploadDemoImage(a.img);
    await call(
      "/observations",
      { method: "POST", body: JSON.stringify({ imageUrl, location: a.location }) },
      token,
    );
    console.log("seed: observation ->", a.name, `(${a.img})`);
  }

  console.log("\nSEED DONE. Demo login:");
  console.log("  email:   ", email);
  console.log("  password:", password);
  console.log("Expected board: NH-48 🔴  Yamuna 🟠  Ring Road 🟡  Outer Ring 🟢");
  console.log("Give the worker ~10-20s, then refresh the dashboard.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
