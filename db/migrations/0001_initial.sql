BEGIN;

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS raw_series (
    id SERIAL PRIMARY KEY,
    item_alias VARCHAR(255) NOT NULL,
    region_alias VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    index_value NUMERIC(10, 4) NOT NULL,
    source_url TEXT NOT NULL,
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS series (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items (id),
    region_id INTEGER NOT NULL REFERENCES regions (id),
    date DATE NOT NULL,
    value NUMERIC(10, 4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS derived_inflation (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items (id),
    region_id INTEGER NOT NULL REFERENCES regions (id),
    period VARCHAR(32) NOT NULL,
    value NUMERIC(10, 4) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS etl_runs (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL,
    checksum VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id),
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    label VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_series_item_region_date
    ON series (item_id, region_id, date);

CREATE INDEX IF NOT EXISTS idx_derived_inflation_metadata_gin
    ON derived_inflation USING GIN (metadata);

COMMIT;
