# Spandan — Frontend (Citizen PWA + Authority Dashboard)

Phase 4 of **Spandan — National Asset Intelligence Grid**. A Next.js 14 (App
Router) Progressive Web App that turns citizens into sensors for public-asset
health and gives authorities an AI-prioritised maintenance dashboard.

It consumes the Phase 3 backend API (`/api/v1`) and visualises the Phase 2 ML
outputs: Structural Health Index (SHI), health bands, defect detections, risk
priority (P0–P3), and remaining-useful-life forecasts.

## Stack

- **Next.js 14.2** (App Router) + **React 18.3** + **TypeScript** (strict)
- **Tailwind CSS 3.4** for styling
- **Recharts** for the SHI trend chart
- **React-Leaflet + Leaflet** (OpenStreetMap tiles) for the civic asset map
- **IndexedDB** offline queue + **service worker** for PWA / offline capture
- **Vitest** for pure-logic unit tests

No backend secrets live here; the only configuration is the API base URL.

## Getting started

```bash
cd frontend
cp env.example .env.local          # set NEXT_PUBLIC_API_BASE_URL if not localhost:8080
npm install
npm run dev                        # http://localhost:3000
```

Make sure the Phase 3 backend is running (`http://localhost:8080`) with at least
one registered authority user and some assets/observations for data to appear.

## Scripts

| Script              | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start the dev server on :3000                    |
| `npm run build`     | Production build (Next standalone output)        |
| `npm start`         | Serve the production build                       |
| `npm run typecheck` | `tsc --noEmit`                                   |
| `npm run lint`      | Next/ESLint                                      |
| `npm test`          | Vitest unit tests (health / risk / format utils) |

## Routes

| Path                              | Role      | Purpose                                        |
| --------------------------------- | --------- | ---------------------------------------------- |
| `/login`, `/register`             | public    | Auth (JWT stored client-side)                  |
| `/report`                         | citizen   | Capture a photo + GPS, submit an observation   |
| `/my-reports`, `/my-reports/[id]` | citizen   | Track submissions + detected defects           |
| `/assets`, `/assets/[id]`         | any       | Browse assets on a map; full asset passport    |
| `/dashboard`                      | authority | Assets ranked by AI risk priority              |
| `/review`                         | authority | Incoming observation queue with status filters |

## Offline & PWA

- Captured photos are downscaled to compact JPEG **data URLs** in the browser
  (see `src/lib/image.ts`). The backend accepts these directly as `imageUrl`.
- If the device is offline (or the API is unreachable), observations are stored
  in an **IndexedDB queue** and auto-synced when connectivity returns
  (`src/lib/offlineQueue.ts`, `src/lib/useQueueSync.ts`).
- A service worker (`public/sw.js`) caches the app shell and static assets and
  is registered in production only.

## API integration

All network calls go through `src/lib/api.ts`, a typed client whose response
shapes mirror the Phase 3 domain models (`src/lib/types.ts`). Auth uses a Bearer
token persisted in `localStorage`.

## Scope honesty (prototype)

- Real object-storage upload (presigned MinIO/S3) is deferred to **Phase 5**;
  `uploadObservationImage()` already abstracts this behind
  `NEXT_PUBLIC_UPLOAD_URL` and falls back to inline data URLs today.
- The map uses colored `CircleMarker`s (no icon assets) coloured by health band.
- Prototype asset scope matches the backend: **roads and bridges**.

## Docker

```bash
docker build -t spandan-frontend .
docker run -p 3000:3000 -e NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1 spandan-frontend
```
