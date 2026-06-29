# Spandan — National Asset Intelligence Grid

> Aadhaar gave every citizen an identity. **Spandan** gives every public asset a pulse — a living Digital Health Passport.

An AI-powered Digital Public Infrastructure platform that detects degradation in public
assets (roads, bridges) from ordinary imagery, computes a **Spandan Health Index (SHI)**,
forecasts failure trajectory, and exposes it to citizens and authorities.

## Monorepo layout

```
spandan/
├─ ai/        # Python — ML pipeline + degradation (SHI) engine
├─ backend/   # Node + TS + Express — APIs, auth, Asset Passport
└─ frontend/  # Next.js PWA — Citizen Portal + Authority Dashboard (Phase 4)
```

## Quick start (Phase 1 — Foundation)

```bash
cp .env.example .env

# AI
cd ai && pip install -e ".[dev]" && ruff check . && pytest -q && cd ..

# Backend
cd backend && npm ci && npm run typecheck && npm test && cd ..

# Infra
docker compose config && docker compose build
pre-commit install && pre-commit run --all-files
```

## Build phases

| Phase | Scope |
|-------|-------|
| 1 | Foundation: repo, Docker, CI, config, dataset pipeline, logging, tests |
| 2 | ML: dataset adapters, training, segmentation, **SHI engine**, eval, ONNX |
| 3 | Backend: Postgres+PostGIS, Redis, Asset Passport, APIs, auth |
| 4 | Frontend: Next.js PWA, dashboard, citizen app, maps, passport UI |
| 5 | Integration: wiring + end-to-end tests + Docker Compose |
| 6 | Polish: docs, demo data, seed scripts, performance, security |

## License

Apache-2.0 (see LICENSE).
