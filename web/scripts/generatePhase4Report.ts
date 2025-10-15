import fs from "node:fs/promises";
import path from "node:path";

import { DATASET_DEFINITIONS } from "@/lib/data/catalog";
import { loadPhase3Items } from "@/lib/data/phase3";
import { collectRegionOptions } from "@/lib/data/phase3Shared";

type RouteStatus = {
  route: string;
  status: number;
  ok: boolean;
  structuredDataCount: number;
  errors: string[];
};

const DATASET_SLUGS = DATASET_DEFINITIONS.map((definition) => definition.slug);
const ROUTES = ["/", "/cpi-dashboard", "/compare", "/datasets", "/calculators", "/inflation-history", "/articles"];
const STAGING_BASE = process.env.STAGING_BASE ?? "http://188.245.150.69";

function extractJsonLd(html: string): string[] {
  const matches = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  return matches.map((match) => match[1].trim());
}

async function getRouteStatus(base: string, route: string): Promise<RouteStatus> {
  const url = new URL(route.replace(/^\/+/, ""), `${base.replace(/\/$/, "")}/`).toString();
  const errors: string[] = [];
  try {
    const response = await fetch(url, { method: "GET" });
    const status = response.status;
    const ok = response.ok;
    const body = await response.text();
    const snippets = extractJsonLd(body);
    snippets.forEach((snippet, index) => {
      try {
        JSON.parse(snippet);
      } catch (error) {
        errors.push(`Failed to parse JSON-LD block ${index + 1}: ${(error as Error).message}`);
      }
    });
    return { route, status, ok, structuredDataCount: snippets.length, errors };
  } catch (error) {
    return {
      route,
      status: 0,
      ok: false,
      structuredDataCount: 0,
      errors: [`Request failed: ${(error as Error).message}`]
    };
  }
}

async function main(): Promise<void> {
  const repoRoot = path.resolve(process.cwd(), "..");
  process.chdir(repoRoot);

  const datasets = await loadPhase3Items(DATASET_SLUGS);
  const datasetMetrics = datasets.map((dataset) => {
    const regions = collectRegionOptions([dataset]);
    return {
      slug: dataset.slug,
      name: dataset.name,
      observations: dataset.metadata.count,
      latestMonth: dataset.metadata.last_date,
      regionCount: regions.length,
      defaultRegion: dataset.defaultRegion
    };
  });

  const datasetsOverHundred = datasetMetrics.filter((item) => item.observations >= 100).length;
  const regionalCoverageOk = datasetMetrics.every((item) => item.regionCount >= 2);
  const missingDatasets = DATASET_SLUGS.filter((slug) => !datasetMetrics.some((item) => item.slug === slug));

  const routeStatuses = await Promise.all(ROUTES.map((route) => getRouteStatus(STAGING_BASE, route)));

  const report = {
    generatedAt: new Date().toISOString(),
    stagingBase: STAGING_BASE,
    ga4: {
      integrated: true,
      measurementIdPresent: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID),
      siteVerificationPresent: Boolean(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION)
    },
    datasets: {
      totalTracked: datasetMetrics.length,
      overHundredObservations: datasetsOverHundred,
      regionalCoverageOk,
      missingDatasets,
      items: datasetMetrics
    },
    routes: routeStatuses
  };

  const reportsDir = path.join(repoRoot, "reports");
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, "phase4-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Failed to generate Phase 4 report", error);
  process.exitCode = 1;
});
