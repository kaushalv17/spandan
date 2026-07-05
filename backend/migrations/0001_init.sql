-- Spandan Phase 3 — initial schema (PostGIS)
-- Applied by src/infrastructure/migrate.ts inside a single transaction.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- gen_random_uuid()

-- Users --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'citizen'
                  CHECK (role IN ('citizen', 'authority', 'admin')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assets (roads + bridges for the prototype) -------------------------------
CREATE TABLE IF NOT EXISTS assets (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_ref TEXT UNIQUE,
    name         TEXT NOT NULL,
    asset_type   TEXT NOT NULL CHECK (asset_type IN ('road', 'bridge')),
    geom         geography(Point, 4326) NOT NULL,
    address      TEXT,
    importance   SMALLINT NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
    created_by   UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS assets_geom_gix ON assets USING GIST (geom);
CREATE INDEX IF NOT EXISTS assets_type_idx ON assets (asset_type);

-- Observations (a citizen photo of an asset) -------------------------------
CREATE TABLE IF NOT EXISTS observations (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id     UUID REFERENCES assets (id) ON DELETE SET NULL,
    reporter_id  UUID REFERENCES users (id) ON DELETE SET NULL,
    image_url    TEXT NOT NULL,
    geom         geography(Point, 4326),
    note         TEXT,
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
    error        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS observations_asset_idx ON observations (asset_id);
CREATE INDEX IF NOT EXISTS observations_status_idx ON observations (status);
CREATE INDEX IF NOT EXISTS observations_geom_gix ON observations USING GIST (geom);

-- Defects (one row per detection on a processed observation) ---------------
CREATE TABLE IF NOT EXISTS defects (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    observation_id UUID NOT NULL REFERENCES observations (id) ON DELETE CASCADE,
    asset_id       UUID REFERENCES assets (id) ON DELETE SET NULL,
    defect_type    TEXT NOT NULL,
    severity       TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
    extent_pct     REAL NOT NULL CHECK (extent_pct >= 0 AND extent_pct <= 100),
    confidence     REAL NOT NULL DEFAULT 1.0,
    bbox           JSONB,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS defects_observation_idx ON defects (observation_id);
CREATE INDEX IF NOT EXISTS defects_asset_idx ON defects (asset_id);

-- Health history (SHI trajectory per asset) --------------------------------
CREATE TABLE IF NOT EXISTS health_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id        UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
    observation_id  UUID REFERENCES observations (id) ON DELETE SET NULL,
    shi             REAL NOT NULL CHECK (shi >= 0 AND shi <= 100),
    band            TEXT NOT NULL,
    total_deduction REAL NOT NULL DEFAULT 0,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS health_history_asset_time_idx
    ON health_history (asset_id, recorded_at DESC);

-- Audit log ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    actor_id    UUID REFERENCES users (id) ON DELETE SET NULL,
    action      TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id   TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON audit_log (entity_type, entity_id);
