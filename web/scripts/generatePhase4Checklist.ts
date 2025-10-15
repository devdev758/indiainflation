import fs from "node:fs/promises";
import path from "node:path";

import { DATASET_DEFINITIONS } from "@/lib/data/catalog";

type Phase4Report = {
  ga4: {
    measurementIdPresent: boolean;
    siteVerificationPresent: boolean;
  };
  datasets: {
    totalTracked: number;
    overHundredObservations: number;
    regionalCoverageOk: boolean;
    items: Array<{
      slug: string;
      name: string;
      observations: number;
      latestMonth: string | null;
      regionCount: number;
    }>;
  };
  routes: Array<{
    route: string;
    ok: boolean;
    status: number;
    structuredDataCount: number;
    errors: string[];
  }>;
};

type ChecklistItem = {
  label: string;
  done: boolean;
  note?: string;
};

type ChecklistSection = {
  title: string;
  items: ChecklistItem[];
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

function renderChecklist(sections: ChecklistSection[]): string {
  const lines: string[] = [];
  lines.push("# Phase 4 Readiness Checklist");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");

  for (const section of sections) {
    lines.push(`## ${section.title}`);
    lines.push("");
    for (const item of section.items) {
      const mark = item.done ? "x" : " ";
      const note = item.note ? ` — ${item.note}` : "";
      lines.push(`- [${mark}] ${item.label}${note}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  const repoRoot = path.resolve(process.cwd(), "..");
  const reportsDir = path.join(repoRoot, "reports");
  const reportPath = path.join(reportsDir, "phase4-report.json");

  const reportExists = await fileExists(reportPath);
  if (!reportExists) {
    throw new Error("phase4-report.json not found. Run npm run report:phase4 first.");
  }

  const raw = await fs.readFile(reportPath, "utf-8");
  const report = JSON.parse(raw) as Phase4Report;

  const seoArticlesReady = await fileExists(path.join(repoRoot, "web", "scripts", "publishPhase4Articles.ts"));
  const dockerComposeExists = await fileExists(path.join(repoRoot, "infra", "docker-compose.prod.yml"));
  const nginxTemplateExists = await fileExists(path.join(repoRoot, "infra", "nginx", "production.conf.template"));
  const backupScriptExists = await fileExists(path.join(repoRoot, "infra", "backups", "pg_backup.sh"));
  const structuredDataValid = report.routes.every((route) => route.ok && route.structuredDataCount > 0 && route.errors.length === 0);
  const routesOk = report.routes.every((route) => route.ok);

  const datasetTable = report.datasets.items
    .map((item) => `| ${item.slug} | ${item.name} | ${item.observations.toLocaleString()} | ${item.regionCount} | ${item.latestMonth ?? "--"} |`)
    .join("\n");

  const sections: ChecklistSection[] = [
    {
      title: "Analytics & SEO",
      items: [
        { label: "GA4 measurement ID configured", done: report.ga4.measurementIdPresent },
        { label: "Google Search Console site verification present", done: report.ga4.siteVerificationPresent },
        { label: "Structured data validates across primary routes", done: structuredDataValid },
        { label: "Two Phase 4 SEO articles ready", done: seoArticlesReady, note: "Run npm run publish:phase4 after setting credentials." }
      ]
    },
    {
      title: "Data completeness",
      items: [
        { label: "All Phase 4 datasets exported", done: report.datasets.totalTracked === DATASET_DEFINITIONS.length },
        { label: ">=100 observations per dataset", done: report.datasets.overHundredObservations === report.datasets.totalTracked },
        { label: "Regional coverage >= 2 regions", done: report.datasets.regionalCoverageOk }
      ]
    },
    {
      title: "Infrastructure",
      items: [
        { label: "Production docker-compose (app, nginx, certbot, backups) present", done: dockerComposeExists },
        { label: "Hardened Nginx template added", done: nginxTemplateExists },
        { label: "Automated Postgres backup script ready", done: backupScriptExists }
      ]
    },
    {
      title: "Deployment health",
      items: [
        { label: "All primary routes return 200", done: routesOk },
        { label: "Sitemap generated", done: await fileExists(path.join(repoRoot, "public", "sitemap.xml")) }
      ]
    }
  ];

  const markdown = renderChecklist(sections);
  const table = [
    "## Dataset summary",
    "",
    "| Slug | Name | Observations | Regions | Latest month |",
    "| --- | --- | --- | --- | --- |",
    datasetTable,
    ""
  ].join("\n");

  const output = `${markdown}\n${table}`;

  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, "phase4-readiness.md"), output, "utf-8");
  console.log("Generated reports/phase4-readiness.md");
}

main().catch((error) => {
  console.error("Failed to generate readiness checklist", error);
  process.exitCode = 1;
});
