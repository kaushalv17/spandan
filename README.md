# Spandan — National Asset Intelligence Grid

> *"Aadhaar gave every citizen an identity. Spandan gives every public asset a pulse — a living Digital Health Passport."*

Spandan is a national **asset-intelligence layer** that gives every public asset — starting with **roads and bridges** — a continuously updated **Digital Health Passport**: a unique ID ("Asset Aadhaar"), a live health score (SHI), detected defects, a degradation trend, and a failure-risk forecast. Ordinary inputs (citizen phone photos, dashcams, CCTV, drone/satellite, future IoT) feed a single **sensor-agnostic degradation engine**.

- **Prototype vertical:** Roads + Bridges
- **Track:** AI Impact Creators (India AI Impact Festival 2026)
- **Deadline:** 15 July 2026

---

## Repository layout

```
spandan/
├─ docker-compose.yml                 # Postgres/PostGIS · Redis · MinIO · ai · backend · frontend
├─ docker-compose.override.yml        # Phase 5: worker service + minio bucket init
├─ Makefile  .env.example  .pre-commit-config.yaml
├─ .github/workflows/ci.yml
├─ ai/            # Python · YOLOv8 · SHI engine · FastAPI model service
├─ backend/       # Node + TS · Express + PostGIS API · BullMQ worker
└─ frontend/      # Next.js 14 PWA (citizen capture + authority dashboard)
```

---

## Build phases (status)

| Phase | Status | Summary |
|-------|--------|---------|
| 1 — Foundation | ✅ Done | Monorepo, Docker Compose, CI, config, dataset pipeline |
| 2 — ML & Health | ✅ Done | SHI engine, RUL forecast, YOLOv8 registry/train/export, FastAPI service |
| 3 — Backend | ✅ Done | Express+PostGIS API, BullMQ worker, risk engine, Asset Passport, JWT/RBAC |
| 4 — Frontend | ✅ Done | Next.js 14 PWA, offline queue, dashboard + passport views |
| 5 — Integration | ✅ Done | Presigned MinIO/S3 uploads, compose wiring, seed, e2e tests |

---

### Phase 1 — Foundation
Repository layout, `docker-compose.yml` (Postgres/PostGIS, Redis, MinIO), `.env.example`, `Makefile`, pre-commit, CI (`.github/workflows/ci.yml`), zod-validated backend config, structlog/pino logging, and the one-command dataset pipeline (`python -m spandan_ai.data.prepare`).

### Phase 2 — ML & Health Intelligence
- `ai/spandan_ai/health/shi.py` — Structural Health Index (SHI) engine (PCI/ASTM D6433-style deduct values). Bands: 🟢 85–100 · 🟡 55–84 · 🟠 25–54 · 🔴 0–24.
- `ai/spandan_ai/health/forecast.py` — least-squares SHI trend → proxy Remaining Useful Life.
- `ai/spandan_ai/models/` — pluggable detector registry + YOLOv8 wrapper.
- `ai/spandan_ai/service/` — FastAPI service: `/health`, `/shi`, `/infer`.
- Dataset adapters (RDD2022 / CODEBRIM / SDNET2018 / DeepCrack) + train/eval/ONNX export.

### Phase 3 — Backend
- `backend/migrations/0001_init.sql` — PostGIS schema (users, assets, observations, defects, health_history, audit_log) with GiST spatial indexes.
- `backend/src/services/*` — auth, observation intake, inference pipeline, forecast, risk engine, Asset Passport.
- `backend/src/worker.ts` — BullMQ consumer running the full inference pipeline against the Phase 2 `/infer`.
- `/api/v1` routes with Zod validation, JWT bearer auth, and RBAC (citizen / authority / admin).
- Risk-priority engine → P0–P3 from band + forecast + civic importance.

### Phase 4 — Frontend
- Next.js 14 App Router PWA + React 18 + TypeScript + Tailwind + Recharts + React-Leaflet.
- Screens: `/login` `/register` `/report` `/my-reports` `/assets` `/assets/[id]` `/dashboard` `/review`.
- Offline capture via IndexedDB queue + service worker; typed API client mirroring Phase 3 models.

### Phase 5 — Integration (this release)
Wires **Frontend ↔ Backend ↔ AI** end-to-end.

**New files:**
- `backend/src/infrastructure/storage.ts` — MinIO/S3 client (path-style), bucket bootstrap + public-read policy, presign helpers.
- `backend/src/http/routes/uploads.ts` — `POST /api/v1/uploads/presign` → `{ uploadUrl, objectUrl, key }` (auth-gated, image types only).
- `frontend/src/lib/upload.ts` — real `uploadObservationImage()`: presign → `PUT` to MinIO → returns public `objectUrl`.
- `docker-compose.override.yml` — adds the `worker` service + a `minio-init` container (auto-creates bucket + anonymous download). Docker merges this with `docker-compose.yml` automatically.
- `backend/scripts/seed.ts` — seeds an authority user, demo road/bridge assets, and sample observations.
- `backend/playwright.config.ts`, `backend/e2e/pipeline.spec.ts`, `backend/e2e/smoke.sh` — end-to-end tests.

**Two manual wire-ups required after extracting:**
1. Mount the router — in your `/api/v1` router (e.g. `backend/src/http/router.ts`):
   ```ts
   import { uploadsRouter } from "./routes/uploads.js";
   router.use("/uploads", uploadsRouter);
   ```
   If your auth middleware isn't at `../middleware/auth.js`, fix the import at the top of `uploads.ts`.
2. Bootstrap the bucket — in `backend/src/main.ts`, before `app.listen(...)`:
   ```ts
   import { ensureBucket } from "./infrastructure/storage.js";
   try { await ensureBucket(); } catch (e) { logger.warn({ e }, "bucket bootstrap skipped"); }
   ```
3. Wire the FE — in the Phase 4 report screen, after capturing a photo:
   ```ts
   import { uploadObservationImage } from "@/lib/upload";
   const imageUrl = await uploadObservationImage(blob);
   await submitObservation({ imageUrl, lat, lng });
   ```

---

## Environment variables

**`backend/.env`** (Phase 5 adds the last three):
```
DATABASE_URL=postgresql://spandan:spandan@localhost:5432/spandan
REDIS_URL=redis://localhost:6379
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=24h
AI_SERVICE_URL=http://localhost:8001
S3_ACCESS_KEY=spandan
S3_SECRET_KEY=spandanminio
S3_BUCKET=spandan-observations
PORT=8080
NODE_ENV=development
# --- Phase 5 ---
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_URL=http://localhost:9000/spandan-observations
```

**`frontend/.env.local`** (Phase 5):
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_UPLOAD_URL=http://localhost:8080/api/v1/uploads/presign
```

---

## Run it (host-run — recommended for the demo)

```powershell
# 0) infra only in Docker
docker compose up -d postgres redis minio minio-init

# 1) AI model service
cd ai; pip install -e ".[dev,ml,service]"; uvicorn spandan_ai.service.app:app --port 8001

# 2) backend API
cd backend; npm install; npm run migrate; npm run dev

# 3) inference worker
cd backend; npm run worker

# 4) frontend
cd frontend; npm install; npm run dev

# 5) seed + tests
cd backend; $env:API_BASE="http://localhost:8080/api/v1"; npm run seed; npm run e2e
```

Open http://localhost:3000, log in with the authority credentials the seed prints, submit a photo report, and watch the passport SHI/band update.

## Scope honesty
Prototype targets **roads and bridges**. The forecaster is a transparent linear trajectory over observed SHI history — a defensible proxy for remaining useful life, not a physical structural simulation.
