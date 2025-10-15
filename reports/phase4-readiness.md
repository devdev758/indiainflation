# Phase 4 Readiness Checklist

Generated: 2025-10-15T07:44:53.430Z

## Analytics & SEO

- [x] GA4 measurement ID configured
- [x] Google Search Console site verification present
- [x] Structured data validates across primary routes
- [x] Two Phase 4 SEO articles ready — Run npm run publish:phase4 after setting credentials.

## Data completeness

- [x] All Phase 4 datasets exported
- [x] >=100 observations per dataset
- [x] Regional coverage >= 2 regions

## Infrastructure

- [x] Production docker-compose (app, nginx, certbot, backups) present
- [x] Hardened Nginx template added
- [x] Automated Postgres backup script ready

## Deployment health

- [x] All primary routes return 200
- [ ] Sitemap generated

## Dataset summary

| Slug | Name | Observations | Regions | Latest month |
| --- | --- | --- | --- | --- |
| cpi-all-items | CPI All Items | 240 | 5 | 2025-12-01 |
| cpi-food-and-beverages | CPI Food & Beverages | 240 | 5 | 2025-12-01 |
| cpi-fuel-and-light | CPI Fuel & Light | 240 | 5 | 2025-12-01 |
| wpi-all-commodities | WPI All Commodities | 240 | 5 | 2025-12-01 |
| imf-cpi-all-items | IMF CPI All Items | 240 | 5 | 2025-12-01 |
