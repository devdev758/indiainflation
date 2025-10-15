import Head from "next/head";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import { CpiComparisonTool } from "@/components/calculators/CpiComparisonTool";
import { YoYCalculator } from "@/components/calculators/YoYCalculator";
import { COMPARISON_SLUGS } from "@/lib/data/catalog";
import { loadPhase3Items, type Phase3ItemDataset } from "@/lib/data/phase3";
import { collectRegionOptions } from "@/lib/data/phase3Shared";

type ComparePageProps = {
  generatedAt: string;
  items: Phase3ItemDataset[];
  regions: Array<{ code: string; name: string; type: string }>;
};

export const getStaticProps: GetStaticProps<ComparePageProps> = async () => {
  const items = await loadPhase3Items(COMPARISON_SLUGS);
  const regions = collectRegionOptions(items);

  return {
    props: {
      generatedAt: new Date().toISOString(),
      items,
      regions
    },
    revalidate: 300
  };
};

export default function ComparePage({ generatedAt, items, regions }: InferGetStaticPropsType<typeof getStaticProps>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/compare`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "India CPI Comparison Tool",
    url: canonicalUrl,
    applicationCategory: "FinanceApplication",
    dateModified: generatedAt
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>Compare India CPI Items & Inflation Trends</title>
        <meta
          name="description"
          content="Overlay CPI series, calculate YoY inflation, and benchmark items instantly with Indiainflation’s comparison tools."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 px-8 py-12 text-white shadow-xl">
        <div className="space-y-4 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">Compare</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Compare CPI items in seconds</h1>
          <p className="mx-auto max-w-3xl text-sm text-blue-100 md:mx-0">
            Select up to five CPI or WPI datasets, normalise the data, and quantify spreads for analysts, founders, and policy observers tracking inflation divergence.
          </p>
        </div>
        <div className="mt-8 grid gap-4 text-sm md:grid-cols-3">
          <MetricCard title="Datasets" value={items.length.toString()} caption="CPI, WPI, IMF feeds" />
          <MetricCard title="Regions" value={regions.length.toString()} caption="Nation + state filters" />
          <MetricCard title="Modes" value="Index / YoY / MoM" caption="Switch metrics on demand" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <CpiComparisonTool datasets={items} regions={regions} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm text-left text-sm text-slate-600">
          <h2 className="text-xl font-semibold text-slate-900">Workflow tips</h2>
          <ul className="mt-3 list-disc space-y-2 pl-4">
            <li>Use the normalise toggle to index all series to a 100 base and compare relative momentum.</li>
            <li>Export the JSON payload for offline modelling or CSV conversion via the export utilities.</li>
            <li>Combine results with the YoY calculator for headline-ready commentary.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">YoY snapshot</h2>
          <YoYCalculator />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-blue-100">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-blue-100/80">{caption}</p>
    </div>
  );
}
