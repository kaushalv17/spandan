import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

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
  const r = await client.query("UPDATE users SET role = 'authority' WHERE email = $1", [email]);
  await client.end();
  if (r.rowCount === 0) throw new Error(`no user with email ${email} to promote`);
}

const ASSETS = [
  { name: "NH-48 Flyover Deck",   assetType: "bridge", location: { lng: 77.1000, lat: 28.5562 }, importance: 5 },
  { name: "Ring Road Segment 12", assetType: "road",   location: { lng: 77.2090, lat: 28.6139 }, importance: 4 },
  { name: "Yamuna Rail Bridge",   assetType: "bridge", location: { lng: 77.2400, lat: 28.6500 }, importance: 5 },
  { name: "Outer Ring Rd KM-34",  assetType: "road",   location: { lng: 77.1800, lat: 28.5000 }, importance: 3 },
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

  const created: Array<{ asset: any; loc: { lng: number; lat: number } }> = [];
  for (const a of ASSETS) {
    const { asset } = await call("/assets", { method: "POST", body: JSON.stringify(a) }, token);
    created.push({ asset, loc: a.location });
    console.log("seed: asset", asset.id, a.name);
  }

  const sampleImg = "https://upload.wikimedia.org/wikipedia/commons/1/1a/Cracks_in_asphalt.jpg";
  for (const c of created.slice(0, 2)) {
    await call(
      "/observations",
      { method: "POST", body: JSON.stringify({ imageUrl: sampleImg, location: c.loc }) },
      token,
    );
    console.log("seed: observation near", c.asset.name ?? c.asset.id);
  }

  console.log("\nSEED DONE. Demo login:");
  console.log("  email:   ", email);
  console.log("  password:", password);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
