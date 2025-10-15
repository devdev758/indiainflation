import fs from "node:fs/promises";
import path from "node:path";

import { loadPhase3Items } from "@/lib/data/phase3";
import { collectRegionOptions } from "@/lib/data/phase3Shared";

const STAGING_BASE = process.env.STAGING_BASE ?? "http://188.245.150.69";
const DATASET_SLUGS = ["milk", "rice", "wpi-all-commodities", "imf-cpi-all-items"];
const ROUTES = ["/", "/cpi-dashboard", "/compare", "/datasets", "/inflation-history"];

async function getRouteStatus(base: string, route: string): Promise<{ route: string; status: number; ok: boolean }> {
  const url = new URL(route, base).toString();
  try {
    const response = await fetch(url, { method: "GET" });
    return { route, status: response.status, ok: response.ok };
  } catch (error) {
    return { route, status: 0, ok: false };
  }
}

async function main(): Promise<void> {
  const repoRoot = path.resolve(__dirname, "..", "..");
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

  const datasetsOverHundred = datasetMetrics.filter((item) => item.observations > 100).length;
  const regionalCoverageOk = datasetMetrics.every((item) => item.regionCount > 1);
  const missingDatasets = DATASET_SLUGS.filter((slug) => !datasetMetrics.some((item) => item.slug === slug));

  const routeStatuses = await Promise.all(ROUTES.map((route) => getRouteStatus(STAGING_BASE, route)));

  const report = {
    generatedAt: new Date().toISOString(),
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
    routes: routeStatuses,
    stagingBase: STAGING_BASE
  };

  const reportsDir = path.join(process.cwd(), "reports");
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.writeFile(path.join(reportsDir, "phase3-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error("Failed to generate Phase 3 report", error);
  process.exitCode = 1;
});
