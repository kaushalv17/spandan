# Spandan — National Asset Intelligence Grid

> *"Aadhaar gave every citizen an identity. Spandan gives every public asset a pulse — a living Digital Health Passport."*

Spandan is a national **asset-intelligence layer** that gives every public asset — starting with **roads and bridges** — a continuously updated **Digital Health Passport**: a unique ID ("Asset Aadhaar"), a live health score (SHI), detected defects, a degradation trend, and a failure-risk forecast.

- **Prototype vertical:** Roads + Bridges
- **Track:** AI Impact Creators (India AI Impact Festival 2026)
- **Deadline:** 15 July 2026

---

## Repository layout

```
spandan/
├─ docker-compose.yml                 # Postgres/PostGIS · Redis · MinIO · ai · backend · frontend
├─ docker-compose.override.yml        # worker service + minio bucket init
├─ demo-assets/                       # bundled demo defect images (Phase 6 seed)
├─ ai/            # Python · YOLOv8 + classical-CV fallback · SHI · FastAPI service
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
| 5 — Integration | ✅ Done | Presigned MinIO uploads, compose wiring, seed, e2e tests, green CI |
| 6 — Inference & Demo | ✅ Done | Detector fallback (no-500), MinIO-backed seed images, live SHI/risk |

---

### Phase 5 — Integration
Presigned MinIO/S3 uploads (`storage.ts`, `POST /uploads/presign`, `upload.ts`), `docker-compose.override.yml` (worker + minio-init), demo seed, Playwright + curl e2e. CI is green (ESLint 9 flat config, Vitest excludes the Playwright e2e, docker job seeds `.env` from `.env.example`).

### Phase 6 — Inference & Demo (this release)
Makes the SHI gauges actually populate end-to-end, fully offline.

**Problems it fixes (found in Phase 5 diagnostics):**
- `/infer` returned **500** because `weights/yolov8_spandan.pt` doesn't exist and Ultralytics can't load it.
- Seed observations failed with **"failed to fetch observation image (404)"** because they pointed at a public Wikimedia URL that blocks server-side fetches.

**Changes:**
- `ai/spandan_ai/models/demo.py` — **DemoDetector**, a classical-CV (OpenCV Canny) fallback that estimates crack/defect coverage from the image, so the SHI pipeline produces realistic, image-driven scores with zero trained weights and zero internet. Deterministic.
- `ai/spandan_ai/service/app.py` — `_detector_instance()` now **tries the real YOLOv8 model first and falls back to DemoDetector** if weights are missing. `/infer` never 500s again. Drop real weights at `weights/yolov8_spandan.pt` and the service uses them automatically on next start — no code change.
- `backend/scripts/seed.ts` — uploads the bundled `demo-assets/*.jpg` to **MinIO** (via the AWS SDK) and points observations at those `localhost:9000` URLs, so the worker fetches locally (no 404s). Seeds observations for **all 4 assets**.
- `demo-assets/` — three generated demo images (`road_pothole.jpg`, `road_crack.jpg`, `bridge_spall.jpg`).

**The honest framing for judges:** the prototype ships a classical-CV baseline detector; dropping trained YOLOv8 weights (from the Phase 2 pipeline on RDD2022/CODEBRIM/SDNET2018) upgrades detection quality with no other change.

---

## Environment variables

**`backend/.env`:**
```
DATABASE_URL=postgresql://spandan:spandan@localhost:5544/spandan
REDIS_URL=redis://localhost:6390
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=24h
AI_SERVICE_URL=http://localhost:8001
S3_ACCESS_KEY=spandan
S3_SECRET_KEY=spandanminio
S3_BUCKET=spandan-observations
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000
S3_PUBLIC_URL=http://localhost:9000/spandan-observations
PORT=8080
NODE_ENV=development
```
(Ports 5544 / 6390 reflect the host port mappings used in your setup; adjust to yours.)

**`frontend/.env.local`:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_UPLOAD_URL=http://localhost:8080/api/v1/uploads/presign
```

---

## Run it (host-run)

```powershell
docker compose up -d postgres redis minio minio-init

# Tab 1 - AI (restart after extracting Phase 6 so the fallback loads)
cd ai; uvicorn spandan_ai.service.app:app --port 8001

# Tab 2 - API
cd backend; npm run dev

# Tab 3 - worker
cd backend; npm run worker

# Tab 4 - frontend
cd frontend; npm run dev

# Tab 5 - seed (uploads demo images to MinIO, seeds assets + observations)
cd backend; $env:API_BASE="http://localhost:8080/api/v1"; npm run seed
```

After the seed, wait ~10-20s for the worker to process, then refresh the dashboard — the SHI gauges, health bands, and P0-P3 risk should populate. For the live demo, use the citizen **/report** screen to upload a photo and watch that asset's passport update.

## Scope honesty
Prototype targets **roads and bridges**. Detection currently uses a classical-CV baseline (until trained YOLOv8 weights are added); the forecaster is a transparent linear trajectory over observed SHI history — a defensible proxy for remaining useful life, not a physical structural simulation.
