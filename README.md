# Indiainflation

Indiainflation provides India-focused inflation insights by combining an ETL pipeline for MOSPI CPI annex data with a Next.js frontend featuring calculators and widgets.

## Quick Start

1. Copy `.env.example` to `.env` and fill in credentials.
2. Install Node.js dependencies:
   ```bash
   cd web
   npm install
   ```
3. Install Python dependencies:
   ```bash
   cd ../etl
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Launch the development stack:
   ```bash
   cd ..
   docker compose -f infra/docker-compose.dev.yml up --build
   ```

## Repository Layout

- `web/` – Next.js app with calculators and widgets.
- `etl/` – Python ETL to fetch, normalize, and export CPI datasets.
- `db/` – SQL migrations and seed data.
- `infra/` – Deployment scripts and docker-compose configurations.
- `.github/` – GitHub Actions workflows.
