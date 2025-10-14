# 🇮🇳 IndiaInflation — Transparent Inflation Analytics for India

IndiaInflation is a data-driven platform that visualizes and explains the Consumer Price Index (CPI) and inflation trends in India, built to make complex government datasets more understandable and actionable.

## 🚀 MVP Goals
- Build a functional prototype showing real CPI and inflation data.
- Enable accurate inflation calculators.
- Create educational content via WordPress integration.
- Establish full CI/CD pipeline to deploy on Hetzner Cloud.

## 🧱 Architecture
```
Next.js (Frontend)
WordPress (Headless CMS)
Python ETL → PostgreSQL → Typesense (Search)
MinIO (S3 backups)
GitHub Actions (CI/CD)
Hetzner Cloud (Hosting)
```

## ⚙️ Tech Stack
| Layer | Tool | Purpose |
|-------|------|----------|
| Frontend | Next.js 14 + React 19 | SSR/SSG, SEO-friendly interface |
| CMS | WordPress | Authoring + REST API |
| Database | PostgreSQL, MariaDB | Analytics + WP content |
| Search | Typesense | Fast API-based indexing |
| Storage | MinIO | Data and backup |
| CI/CD | GitHub Actions | Auto build/test/deploy |
| Hosting | Hetzner | Scalable & cost-effective |

## 🧩 Current Status
✅ Staging deployment successful  
✅ CI/CD pipeline operational  
✅ ETL data ingestion and export verified  
🟡 Inflation calculators & visuals in progress  
🟡 UI/UX improvements pending  
🔜 Production deployment + SSL setup

## 📂 Repository Structure
```
indiainflation/
├── web/               # Next.js frontend
├── etl/               # Python ETL for CPI data
├── infra/             # Docker Compose and environment setup
├── scripts/           # Deployment & backup scripts
├── db/                # Seeds and migrations
└── .github/workflows/ # CI/CD pipelines
```

## 🧠 Development Workflow
1. Push changes to `main`
2. GitHub Actions builds and deploys to staging
3. Staging health check: `/api/health` → HTTP 200
4. Nightly PostgreSQL dump to MinIO

## 🧭 Next Steps
- Add CPI calculator and value-over-time tool  
- Integrate Recharts for CPI trend visualizations  
- Improve SEO metadata & preview modes  
- Deploy to production with HTTPS  

---

📘 **Docs:**  
For full details, read [`docs/IndiaInflation_Project_Technical_Overview_v1.md`](docs/IndiaInflation_Project_Technical_Overview_v1.md)

© 2025 IndiaInflation. All rights reserved.
