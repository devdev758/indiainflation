/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="node" />

import { ArticleDefinition, ArticlePublishSummary, ArticleResult, WordPressPost } from "../types/articleTypes";

const articles: ArticleDefinition[] = [
  {
    title: "Advanced Inflation Calculators Blueprint for 2025",
    slug: "advanced-inflation-calculators-blueprint-2025",
    excerpt:
      "Design inflation converters, CPI vs WPI differentials, and state comparison dashboards using Indiainflation’s Phase 4 data architecture.",
    content: `
      <p>Phase 4 of Indiainflation introduces production-grade CPI/WPI exports, a professional blue-gray UI, and new calculation engines. This guide walks product managers, analysts, and engineers through the end-to-end blueprint for building the inflation calculator suite now live on indiainflation.in.</p>
      <h2>1. Data contracts and schema</h2>
      <p>Every calculator consumes the <code>ItemExportData</code> schema (export_schema_version v2). Confirm the presence of <code>default_region</code>, <code>regional_series</code>, and YoY/MoM derivatives before wiring visualisations. For server usage, rely on <code>loadPhase3Items</code> and the new catalog helpers in <code>@/lib/data/catalog</code>.</p>
      <h2>2. Inflation converter workflow</h2>
      <ol>
        <li>Fetch headline CPI via <code>useItemExports(["cpi-all-items"])</code>.</li>
        <li>Normalise to 100 using the <code>Normalise</code> toggle logic shared by <code>CpiComparisonTool</code>.</li>
        <li>Expose JSON-LD snippets describing each conversion scenario (use <code>@type: FinancialProduct</code> for SERP rich results).</li>
      </ol>
      <p class="callout">Phase 4 ships a dedicated CPI vs WPI differential card—reuse its spread calculation to support salary escalator forms.</p>
      <h2>3. CPI vs WPI differential</h2>
      <p>The new <strong>CpiWpiDifferential</strong> component compares <code>cpi-all-items</code> with <code>wpi-all-commodities</code>. Key implementation notes:</p>
      <ul>
        <li>Generate spreads server-side for export APIs to keep client bundles lean.</li>
        <li>Log YoY differentials to S3 for scenario replay; attach the generated JSON to stakeholder reports.</li>
        <li>Annotate the chart with <code>application/ld+json</code> markup representing an <code>Observation</code> series so Google can index price insights.</li>
      </ul>
      <h2>4. State comparison automation</h2>
      <p>Regional CPI is the headline upgrade in Phase 4. The <strong>StateComparisonChart</strong> component demonstrates how to:</p>
      <ul>
        <li>Filter <code>regional_series</code> down to state-level codes.</li>
        <li>Limit simultaneous overlays to four regions for legibility.</li>
        <li>Cycle colour palettes while keeping accessibility contrast above WCAG AA.</li>
      </ul>
      <p>Pair charts with JSON-LD <code>Dataset</code> nodes describing the data source (MOSPI, DPIIT, IMF) to pass structured-data validation.</p>
      <h2>5. QA and validation</h2>
      <p>Before shipping, run <code>npm run seo:validate</code> to confirm each route exposes parseable JSON-LD. The validation script fetches pages, extracts <code>application/ld+json</code> blocks, and reports parsing errors.</p>
      <h2>6. Roadmap extensions</h2>
      <p>Future iterations can add loan amortisation widgets keyed to CPI forecasts, or integrate GA4 events for calculator usage analytics.</p>
    `
  },
  {
    title: "Production Deployment Checklist for CPI Analytics Platforms",
    slug: "production-deployment-checklist-cpi-analytics",
    excerpt:
      "Turn Indiainflation’s Phase 4 infrastructure playbook into a reusable deployment checklist covering Docker, Nginx, HTTPS, cron refreshes, and backups.",
    content: `
      <p>Delivering inflation intelligence at scale demands more than dashboards—it requires hardened infrastructure, automated refreshes, and compliance-friendly backups. This production checklist distils Indiainflation’s Phase 4 setup into actionable steps for teams rolling out CPI analytics platforms.</p>
      <h2>1. Container orchestration</h2>
      <p>Use the new <code>infra/docker-compose.prod.yml</code> to coordinate the Next.js app, Nginx reverse proxy, Certbot renewals, and backup jobs. Parameterise credentials via environment variables (GA4, Search Console, S3 endpoints) and inject them at build time.</p>
      <h2>2. HTTPS and reverse proxy</h2>
      <ol>
        <li>Generate Diffie-Hellman parameters with <code>infra/nginx/generate-dhparam.sh</code>.</li>
        <li>Bootstrap Let’s Encrypt certificates using <code>infra/nginx/init-letsencrypt.sh</code>.</li>
        <li>Adopt the hardened Nginx template with CSP, HSTS, and referrer policies to pass security audits.</li>
      </ol>
      <h2>3. Automated ETL refresh</h2>
      <p>Schedule <code>etl/monthly_refresh.py</code> via the cron wrapper so CPI/WPI exports stay current. Publish status updates to observability dashboards and alert stakeholders if ingestion falls behind.</p>
      <h2>4. Backup and retention policy</h2>
      <p>The <code>pg_backup.sh</code> script now uploads compressed SQL dumps to S3-compatible storage and prunes files based on <code>BACKUP_RETENTION_DAYS</code>. Document credentials in a secrets manager and rehearse restoration quarterly.</p>
      <h2>5. Structured-data and SEO QA</h2>
      <p>Run <code>npm run seo:validate</code> after deployments to confirm every primary route contains valid JSON-LD. Cross-check the sitemap and submit updates to Google Search Console.</p>
      <h2>6. Launch communication</h2>
      <p>Bundle GA4 dashboards with newsletter snippets highlighting the new calculators, regional datasets, and download endpoints. Include JSON-LD <code>Article</code> metadata in release notes for better SERP visibility.</p>
      <p class="callout">Download the printable deployment checklist (PDF) to standardise handoffs between engineering, infra, and content teams.</p>
    `
  }
];

function optionalEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value.trim();
    }
  }
  return undefined;
}

function requireEnv(...names: string[]): string {
  const value = optionalEnv(...names);
  if (!value) {
    throw new Error(`Missing required environment variable: ${names.join("/")}`);
  }
  return value;
}

function normaliseBase(raw: string): string {
  return raw.replace(/\s+/g, "").replace(/\/*$/, "");
}

function buildUrl(base: string, path: string, params?: Record<string, string>): string {
  if (base.includes("rest_route")) {
    const url = new URL(base);
    const current = url.searchParams.get("rest_route") ?? "/";
    const combined = `${current.replace(/\/$/, "")}/${path.replace(/^\/+/g, "")}`.replace(/\/+/g, "/");
    url.searchParams.set("rest_route", combined.startsWith("/") ? combined : `/${combined}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  const url = new URL(path.replace(/^\/+/g, ""), `${base}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function request<T>(rawBase: string, authHeader: string, path: string, init?: RequestInit, params?: Record<string, string>): Promise<T> {
  const url = path.startsWith("http") ? path : buildUrl(rawBase, path, params);
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...(init?.headers ?? {})
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`WordPress API error ${response.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function upsertArticle(base: string, authHeader: string, article: ArticleDefinition): Promise<{ status: "created" | "updated"; result: ArticleResult }> {
  const candidates = await request<WordPressPost[]>(base, authHeader, "wp/v2/posts", { method: "GET" }, {
    slug: article.slug,
    per_page: "1",
    context: "edit"
  });

  if (candidates.length > 0) {
    const existing = candidates[0];
    const updated = await request<WordPressPost>(base, authHeader, `wp/v2/posts/${existing.id}`, {
      method: "POST",
      body: JSON.stringify({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        status: "publish"
      })
    });

    return {
      status: "updated",
      result: { title: article.title, slug: article.slug, id: updated.id, url: updated.link }
    };
  }

  const created = await request<WordPressPost>(base, authHeader, "wp/v2/posts", {
    method: "POST",
    body: JSON.stringify({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      status: "publish"
    })
  });

  return {
    status: "created",
    result: { title: article.title, slug: article.slug, id: created.id, url: created.link }
  };
}

async function main(): Promise<void> {
  const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

  const base = dryRun
    ? ""
    : normaliseBase(requireEnv("INDIAINFLATION_WP_API_BASE", "WORDPRESS_API_BASE"));
  const user = dryRun ? "" : requireEnv("INDIAINFLATION_WP_ADMIN_USER", "WORDPRESS_ADMIN_USER");
  const password = dryRun ? "" : requireEnv("INDIAINFLATION_WP_APP_PASSWORD", "WORDPRESS_APP_PASSWORD");
  const authHeader = dryRun ? "" : `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;

  const summary: ArticlePublishSummary = {
    total: articles.length,
    created: [],
    updated: [],
    skipped: [],
    failed: []
  };

  for (const article of articles) {
    try {
      if (dryRun) {
        summary.skipped.push({ title: article.title, slug: article.slug });
        continue;
      }
      const { status, result } = await upsertArticle(base, authHeader, article);
      summary[status === "created" ? "created" : "updated"].push(result);
    } catch (error) {
      summary.failed.push({
        title: article.title,
        slug: article.slug,
        error: error instanceof Error ? error.message : "unknown error"
      });
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Failed to publish Phase 4 articles", error);
  process.exitCode = 1;
});
