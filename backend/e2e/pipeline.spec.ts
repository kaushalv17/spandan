import { test, expect, request } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

function loadEnv() {
  try {
    const txt = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
    }
  } catch {
    // ignore
  }
}
loadEnv();

const API = process.env.API_BASE || "http://localhost:8080/api/v1";

async function promote(email: string) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query("UPDATE users SET role='authority' WHERE email=$1", [email]);
  await client.end();
}

test("citizen -> observation -> worker -> passport", async () => {
  const ctx = await request.newContext();
  const email = `e2e+${Date.now()}@spandan.test`;
  const password = "Spandan@12345";

  const reg = await ctx.post(`${API}/auth/register`, { data: { email, password, fullName: "E2E Authority" } });
  expect(reg.ok()).toBeTruthy();
  await promote(email);

  const login = await ctx.post(`${API}/auth/login`, { data: { email, password } });
  expect(login.ok()).toBeTruthy();
  const { token } = await login.json();
  const auth = { Authorization: `Bearer ${token}` };

  const assetRes = await ctx.post(`${API}/assets`, {
    headers: auth,
    data: { name: "E2E Road", assetType: "road", location: { lng: 77.20, lat: 28.61 }, importance: 4 },
  });
  expect(assetRes.ok()).toBeTruthy();
  const { asset } = await assetRes.json();

  const obs = await ctx.post(`${API}/observations`, {
    headers: auth,
    data: {
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/1/1a/Cracks_in_asphalt.jpg",
      location: { lng: 77.20, lat: 28.61 },
    },
  });
  expect(obs.ok()).toBeTruthy();

  // worker processes async; poll the passport
  let passport: any = null;
  for (let i = 0; i < 20; i++) {
    const p = await ctx.get(`${API}/assets/${asset.id}`, { headers: auth });
    if (p.ok()) passport = await p.json();
    if (passport && /healthIndex|shi|band/i.test(JSON.stringify(passport))) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  expect(passport).toBeTruthy();
  console.log("passport:", JSON.stringify(passport, null, 2));
});
