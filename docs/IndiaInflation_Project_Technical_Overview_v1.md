# IndiaInflation Project Technical & Strategic Overview (v1.0 — October 2025)

## 1. Project Vision
Goal: Create India’s most accurate, interactive, and transparent inflation data & analytics platform, bridging official CPI data (MOSPI) and public understanding through live dashboards, calculators, and educational content.

MVP Objective: Deliver a working public prototype that includes a functional web app, WordPress CMS, live inflation calculators, indexed search, and stable CI/CD deployment.

## 2. Architecture Overview
The platform combines a Next.js frontend, WordPress CMS backend, and Python ETL data layer on Hetzner Cloud, integrated through Docker and GitHub Actions.

## 3. Tech Stack — with Rationale
- Frontend: Next.js 14 + React 19
- Styling/UI: TailwindCSS + shadcn/ui
- Backend CMS: WordPress (Headless)
- DBs: PostgreSQL 16 & MariaDB 11.4
- ETL: Python + MOSPI CPI fetcher
- Search: Typesense
- Storage: MinIO
- CI/CD: GitHub Actions
- Hosting: Hetzner Cloud
- Monitoring: Prometheus + Grafana (upcoming)

## 4. Key Components & Current Status
Frontend, API, WordPress CMS, ETL pipeline, Search index, and MinIO backups are all working in staging. Monitoring, calculators, and UI/UX polish are pending.

## 5. Accomplished Tasks
All major infrastructure and pipelines built, WordPress & DBs configured, Typesense indexed, CI/CD functional via GitHub Actions + SSH deploy to Hetzner.

## 6. Remaining MVP Milestones
Next: Build Inflation Calculators, Charts, SEO, and polish UI/UX before production deployment.

## 7. Repo Structure (Simplified)
```
indiainflation/
├── .github/workflows/
├── web/
├── etl/
├── infra/
├── scripts/
└── db/
```

## 8. Development Workflow
Push → CI build → Docker image → SSH deploy → Health check → Nightly MinIO backup.

## 9. Known Issues / Future Enhancements
Add ISR revalidation for WordPress posts, throttle ETL CPU usage, introduce Redis cache, improve SEO.

## 10. Next Actions
1️⃣ Validate staging UI  
2️⃣ Verify WordPress post sync  
3️⃣ Build inflation calculators  
4️⃣ Setup production workflow  
5️⃣ Public Beta Launch 🎉
