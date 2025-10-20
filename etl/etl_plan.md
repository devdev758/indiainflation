# IndiaInflation ETL Pipeline Plan

## 1. Overview

The IndiaInflation ETL pipeline ingests CPI, WPI, and auxiliary inflation datasets into PostgreSQL to support analytics, APIs, and dashboards. The architecture follows a modular Extract → Transform → Load flow orchestrated by scheduled jobs. Core components include configurable extractors, Pandas-based transformers, and idempotent loaders targeting the tables defined in `db/schema.sql` with reusable views from `db/views.sql` for downstream consumption.

High-level architecture:

```text
Data Sources (MoSPI, DPIIT, IMF)
        ↓
Extractors (HTTP/SDMX/Excel fetchers)
        ↓
Staging Zone (parquet/csv cache in etl/data/)
        ↓
Transformers (Pandas normalization + validation)
        ↓
Loaders (SQLAlchemy/psycopg UPSERTs → PostgreSQL)
        ↓
Analytics Layer (views.sql, API services, dashboards)
```

## 2. Data Sources

The pipeline integrates the sources cataloged in `docs/data_sources.md`:

- **CPI National series (MoSPI):** Monthly rural/urban/combined indices across major and sub-groups.
- **CPI State-wise series (MoSPI):** State/UT CPI values and YoY rates with subgroup detail.
- **CPI Basket Weights (MoSPI):** Sectoral weights aligning with CPI group/subgroup taxonomy.
- **Wholesale Price Index (DPIIT / Ministry of Commerce):** Monthly WPI categories (All Items, Primary, etc.).
- **Metadata & Release Schedules (MoSPI press releases):** Official release calendar and status flags driving automation triggers.
- **Optional IMF SDDS feeds:** Comparative CPI series for international benchmarking (deferred implementation).

## 3. Extract Strategy

### 3.1 Fetching MoSPI/DPIIT Files
- Use `requests` + `tenacity` retry wrappers to download Excel/XLSX, CSV, and SDMX files.
- Automate discovery of new annexures via portal scrape or known URL patterns (e.g., `CPI-SDMX-Month wise`).
- Save raw files under `etl/data/raw/{source}/{YYYY_MM}/` for traceability.

### 3.2 Historical Archives
- Maintain manifest CSVs enumerating historical file URLs.
- Bootstrap archive loads by iterating manifests and using the same downloader utilities.
- Ensure checksums (MD5) or file timestamps prevent redundant downloads.

### 3.3 Release Detection
- Poll MoSPI/DPIIT release pages weekly via scheduled job.
- Parse HTML/PDF metadata to extract dataset name, release date, and status.
- Compare with `metadata_releases` table; insert new entries with `ON CONFLICT DO NOTHING`.
- Trigger downstream extraction when a new `Final` or `Provisional` record is persisted.

## 4. Transform Strategy

### 4.1 Normalization Steps
- Load raw files into Pandas DataFrames using `pandas.read_excel`, `read_csv`, or `pysdmx` for SDMX.
- Standardize column names to snake_case (e.g., `Month` → `month`).
- Convert date strings (`YYYY-MM`, `Apr-2023`) to `datetime.date` set to first-of-month.
- Map sector labels (`RURAL`, `Urban`, etc.) to canonical values (`Rural`, `Urban`, `Combined`).
- Align major group and subgroup names/ids with controlled vocab.

### 4.2 Derived Metrics
- For CPI tables, calculate `yoy_inflation_rate` = `(current_index - prior_year_index) / prior_year_index * 100`.
- Persist both index values and computed rates in transformed DataFrames.

### 4.3 Foreign Key Alignment
- Merge transformed CPI data with `cpi_weights` using `(sector, major_group, subgroup)` to validate taxonomy.
- Flag mismatches for review; records failing FK alignment are routed to `etl/data/rejects/`.

### 4.4 Data Quality Checks
- Verify consecutive monthly coverage; identify gaps (excluding known omissions like Apr/May 2020).
- Detect duplicate rows based on date/region/segment keys.
- Ensure numeric fields parse to `float` and fall within expected ranges.

## 5. Load Strategy

- Use SQLAlchemy or psycopg3 connections with `COPY` + staging tables for bulk inserts when volume warrants, otherwise parameterized `executemany`.
- Implement UPSERT logic: `INSERT ... ON CONFLICT (unique_key) DO UPDATE SET ...` to ensure idempotent re-runs.
- Wrap loads in transactions with rollback on failure and structured logging.
- Maintain load manifests summarizing row counts, hashes, and timestamps per dataset.

Example UPSERT snippet (psycopg3):

```sql
INSERT INTO cpi_national (observation_month, sector, major_group, subgroup, index_value, yoy_inflation_rate, base_year)
VALUES (%(observation_month)s, %(sector)s, %(major_group)s, %(subgroup)s, %(index_value)s, %(yoy_inflation_rate)s, %(base_year)s)
ON CONFLICT (observation_month, sector, major_group, subgroup)
DO UPDATE SET
    index_value = EXCLUDED.index_value,
    yoy_inflation_rate = EXCLUDED.yoy_inflation_rate,
    base_year = EXCLUDED.base_year,
    updated_at = NOW();
```

## 6. Validation & Logging

- Implement validation hooks post-load:
  - Cross-check row counts against source file totals.
  - Confirm each current month exists across CPI sectors and states.
  - Scan for NULLs in non-nullable columns before commit.
  - Compare computed YoY rates with published values (where available) within tolerance.
- Logging stack:
  - Use Python `structlog` or standard logging with JSON format.
  - Emit logs per extraction, transformation, and load stage.
  - Archive logs under `etl/logs/{YYYY}/{MM}/` and push summaries to monitoring (e.g., Slack webhook).
- Validation failures trigger:
  - Record in `etl/data/rejects/validation_report.json`.
  - Mark corresponding release in `metadata_releases` as requiring manual review.

## 7. Automation & Scheduling

- Primary scheduler: GitHub Actions workflow (`.github/workflows/monthly_etl.yml`).
  - Triggers on cron `0 6 15 * *` (15th of every month at 06:00 UTC) and manual dispatch.
  - Steps: set up Python, install `etl/requirements.txt`, run `python etl/monthly_refresh.py`.
- Secondary cron (server-based) optional redundancy: systemd timer or crontab entry targeting the same script.
- After MoSPI releases detected (`metadata_releases` insert), queue on-demand run via workflow dispatch or message queue (e.g., Redis + RQ worker).

## 8. ETL Folder Structure

```text
etl/
├── config/
│   ├── datasources.yml          # URLs, endpoints, API keys
│   └── mappings/                # Sector/group normalization maps
├── data/
│   ├── raw/                     # Raw downloads partitioned by source/date
│   ├── staging/                 # Cleaned intermediate Parquet/CSV files
│   └── rejects/                 # Rows failing validation with diagnostics
├── jobs/
│   ├── extract_cpi.py
│   ├── extract_wpi.py
│   ├── transform_cpi.py
│   ├── transform_wpi.py
│   ├── load_cpi.py
│   └── load_wpi.py
├── pipelines/
│   ├── cpi_pipeline.py          # Orchestration combining extract/transform/load
│   └── wpi_pipeline.py
├── utils/
│   ├── downloader.py
│   ├── parsers.py
│   ├── validators.py
│   └── db.py
├── monthly_refresh.py           # Entry point for scheduled runs
├── phase3_pipeline.py
├── export_json.py
└── etl_plan.md                  # This architecture plan
```

## 9. Next Steps & Integration

- **API Layer:** Expose REST/GraphQL endpoints utilizing `db/views.sql` (e.g., `/api/v1/inflation-summary`, `/api/v1/statewise-latest`).
- **Frontend Dashboards:** Integrate Superset/Metabase or custom React charts querying the views for latest metrics.
- **Alerting:** Build monitoring jobs that reference `metadata_releases` to notify stakeholders of new provisional/final data.
- **Data Science Integration:** Provide versioned exports (Parquet/CSV) for forecasting models leveraging consistent schema.
- **Documentation:** Update developer onboarding with ETL runbooks and troubleshooting guides aligned with this plan.

With this plan, a Python developer can scaffold the modular ETL pipeline, implement the extract/transform/load job scripts, and connect the resulting datasets to IndiaInflation.com dashboards and APIs.
