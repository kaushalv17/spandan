# Spandan — National Asset Intelligence Grid

> *"Aadhaar gave every citizen an identity. Spandan gives every public asset a pulse — a living Digital Health Passport."*

Spandan gives every public asset — starting with **roads and bridges** — a continuously updated **Digital Health Passport**: a unique ID, a live health score (SHI), detected defects, a degradation trend, and a failure-risk forecast.

- **Prototype vertical:** Roads + Bridges
- **Track:** AI Impact Creators (India AI Impact Festival 2026)
- **Deadline:** 15 July 2026

---

## Repository layout

```
spandan/
├─ docker-compose.yml / docker-compose.override.yml   # infra + worker + minio init
├─ demo-assets/       # graded demo defect images (seed)
├─ notebooks/         # Colab GPU training notebook
├─ ai/                # Python · YOLOv8 + classical-CV fallback · SHI · FastAPI
├─ backend/           # Node + TS · Express + PostGIS API · BullMQ worker
└─ frontend/          # Next.js 14 PWA (citizen capture + authority dashboard)
```

---

## Build phases (status)

| Phase | Status | Summary |
|-------|--------|---------|
| 1 — Foundation | ✅ | Monorepo, Docker Compose, CI, config, dataset pipeline |
| 2 — ML & Health | ✅ | SHI engine, RUL forecast, YOLOv8 registry/train/export, FastAPI service |
| 3 — Backend | ✅ | Express+PostGIS API, BullMQ worker, risk engine, Asset Passport, JWT/RBAC |
| 4 — Frontend | ✅ | Next.js 14 PWA, offline queue, dashboard + passport views |
| 5 — Integration | ✅ | Presigned MinIO uploads, compose wiring, seed, e2e tests, green CI |
| 6 — Inference & Demo | ✅ | CV fallback detector (no-500), MinIO-backed seed images, live SHI |
| 7 — Demo Tuning & Weights | ✅ | Graded board across all 4 bands + real-weights training kit |

---

### Phase 6 — Inference & Demo
CV fallback detector so `/infer` never 500s; seed uploads images to MinIO so the worker fetches locally. SHI/risk populate end-to-end offline.

### Phase 7 — Demo Tuning & Real Weights (this release)

**1. Nuanced board.** The CV fallback was recalibrated (coverage-based crack + pothole extents) and paired with four graded demo images so the seeded assets land in **all four SHI bands** (verified against the SHI formula):

| Asset | Image | SHI | Band |
|---|---|---|---|
| Outer Ring Rd KM-34 | `asset_healthy.jpg` | ~99 | 🟢 Healthy |
| Ring Road Segment 12 | `asset_degrading.jpg` | ~83 | 🟡 Degrading |
| Yamuna Rail Bridge | `asset_critical.jpg` | ~33 | 🟠 Critical |
| NH-48 Flyover Deck | `asset_failure.jpg` | ~0 | 🔴 Failure-risk |

Files: `ai/spandan_ai/models/demo.py` (tuned), `demo-assets/asset_*.jpg` (new), `backend/scripts/seed.ts` (asset→band mapping).

**2. Real YOLOv8 weights.** A ready-to-run training kit that produces `ai/weights/yolov8_spandan.pt`, which the Phase 6 loader auto-detects on next start:
- `notebooks/spandan_train_colab.ipynb` — free-GPU (Colab T4) training on RDD2022 + CODEBRIM.
- `ai/README_TRAINING.md` — Colab + local-GPU runbook and dataset notes.

Full RDD2022 training needs a GPU; Colab is the recommended path. Until weights are added, the tuned CV fallback keeps the demo fully working offline.

---

## Run it (host-run)

```powershell
docker compose up -d postgres redis minio minio-init
cd ai; uvicorn spandan_ai.service.app:app --port 8001     # Tab 1 (restart after extracting)
cd backend; npm run dev                                    # Tab 2
cd backend; npm run worker                                 # Tab 3
cd frontend; npm run dev                                   # Tab 4
cd backend; $env:API_BASE="http://localhost:8080/api/v1"; npm run seed   # Tab 5
```
After seeding, wait ~10-20s, then refresh the dashboard: one asset in each band. For the live demo, use the citizen **/report** screen to upload a photo and watch that asset update.

## Scope honesty
Prototype targets **roads and bridges**. Detection uses a calibrated classical-CV baseline until trained YOLOv8 weights are added; the forecaster is a transparent linear trajectory over observed SHI history — a defensible proxy for remaining useful life, not a physical simulation.
