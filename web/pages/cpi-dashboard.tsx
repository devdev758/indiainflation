import Head from "next/head";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import { CpiTrendChart, type CpiTrendPoint } from "@/components/charts/CpiTrendChart";
import { loadItemExport, type ItemExportData } from "@/lib/exportLoader";

type DashboardProps = {
  trendData: CpiTrendPoint[];
  metrics: {
    milkYoY: number | null;
    riceYoY: number | null;
    coverageMonths: number;
  };
  generatedAt: string;
};

export const getStaticProps: GetStaticProps<DashboardProps> = async () => {
  const [milk, rice] = await Promise.all([
    safeLoad("milk"),
    safeLoad("rice")
  ]);

  const trendData = buildTrendDataset([
    { key: "milk", label: "Milk CPI", color: "#2563eb", dataset: milk },
    { key: "rice", label: "Rice CPI", color: "#10b981", dataset: rice }
  ]);

  return {
    props: {
      trendData,
      metrics: {
        milkYoY: latestYoY(milk),
        riceYoY: latestYoY(rice),
        coverageMonths: Math.max(milk?.series.length ?? 0, rice?.series.length ?? 0)
      },
      generatedAt: new Date().toISOString()
    },
    revalidate: 300
  };
};

export default function CpiDashboardPage({ trendData, metrics, generatedAt }: InferGetStaticPropsType<typeof getStaticProps>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/cpi-dashboard`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Indiainflation CPI dashboard",
    url: canonicalUrl,
    dateModified: generatedAt,
    measurementTechnique: "MOSPI CPI"
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>India CPI dashboard | Indiainflation</title>
        <meta
          name="description"
          content="Track CPI trends for essential items with YoY calculations and coverage statistics sourced from Indiainflation exports."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-8 text-white shadow-xl">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Dashboard</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">India CPI dashboard</h1>
          <p className="max-w-3xl text-sm text-blue-100">
            Quick insights into CPI movements using Indiainflation’s cleaned exports. Item-level trends help spot volatility before national releases.
          </p>
        </div>
        <div className="mt-6 grid gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">Milk YoY %</p>
            <p className="text-2xl font-semibold">{formatMaybePercent(metrics.milkYoY)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">Rice YoY %</p>
            <p className="text-2xl font-semibold">{formatMaybePercent(metrics.riceYoY)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-blue-100">Months of coverage</p>
            <p className="text-2xl font-semibold">{metrics.coverageMonths}</p>
          </div>
        </div>
      </section>

      <section>
        <CpiTrendChart
          data={trendData}
          series={[
            { key: "milk", label: "Milk CPI", color: "#2563eb" },
            { key: "rice", label: "Rice CPI", color: "#10b981" }
          ]}
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm text-sm text-slate-600">
        <h2 className="text-xl font-semibold text-slate-900">How to use this dashboard</h2>
        <ul className="mt-3 list-disc space-y-2 pl-4">
          <li>Use the compare page to overlay additional CPI items for deeper analysis.</li>
          <li>Download the raw exports from the datasets page for custom modelling.</li>
          <li>Combine YoY snapshots with YoY calculator results for quick summaries.</li>
        </ul>
      </section>
    </div>
  );
}

async function safeLoad(slug: string): Promise<ItemExportData | null> {
  try {
    const result = await loadItemExport(slug, true);
    return result.data;
  } catch (error) {
    console.error(`failed to load export for ${slug}`, error);
    return null;
  }
}

function buildTrendDataset(
  inputs: Array<{ key: string; label: string; color: string; dataset: ItemExportData | null }>
): CpiTrendPoint[] {
  const dateMap = new Map<string, CpiTrendPoint>();
  inputs.forEach(({ key, dataset }) => {
    dataset?.series.forEach((entry) => {
      if (!entry.date) return;
      const current = dateMap.get(entry.date) ?? { date: entry.date };
      current[key] = entry.index_value ?? null;
      dateMap.set(entry.date, current as CpiTrendPoint);
    });
  });
  return Array.from(dateMap.values()).sort((a, b) => (a.date > b.date ? 1 : -1)).slice(-60);
}

function latestYoY(dataset: ItemExportData | null): number | null {
  if (!dataset || dataset.series.length === 0) {
    return null;
  }
  return dataset.series.at(-1)?.yoy_pct ?? null;
}

function formatMaybePercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${value.toFixed(2)}%`;
}
