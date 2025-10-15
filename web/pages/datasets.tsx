import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import { DATASET_CATALOG, DATASET_DEFINITIONS } from "@/lib/data/catalog";
import { loadPhase3Items, type Phase3ItemDataset } from "@/lib/data/phase3";
import { getRegionSeries } from "@/lib/data/phase3Shared";
import { safeFormatDate } from "@/lib/utils/date";

interface DatasetSummary {
  slug: string;
  title: string;
  description: string;
  count: number;
  lastDate: string | null;
  regions: number;
  source: string;
}

type DatasetsPageProps = {
  datasets: DatasetSummary[];
  generatedAt: string;
};

function buildDatasetSummary(dataset: Phase3ItemDataset): DatasetSummary {
  const meta = DATASET_CATALOG[dataset.slug] ?? { description: dataset.name, source: "CPI" };
  const defaultSeries = getRegionSeries(dataset, dataset.defaultRegion);
  const lastDate = defaultSeries?.series.at(-1)?.date ?? null;
  const count = defaultSeries?.metadata.count ?? defaultSeries?.series.length ?? 0;

  return {
    slug: dataset.slug,
    title: dataset.name,
    description: meta.description,
    count,
    lastDate,
    regions: dataset.regions.length,
    source: meta.source
  };
}

export const getStaticProps: GetStaticProps<DatasetsPageProps> = async () => {
  const items = await loadPhase3Items(DATASET_DEFINITIONS.map((entry) => entry.slug));
  const datasets = items.map(buildDatasetSummary);

  return {
    props: {
      datasets,
      generatedAt: new Date().toISOString()
    },
    revalidate: 300
  };
};

export default function DatasetsPage({ datasets, generatedAt }: InferGetStaticPropsType<typeof getStaticProps>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/datasets`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Indiainflation CPI exports",
    url: canonicalUrl,
    dateModified: generatedAt,
    dataset: datasets.map((dataset) => ({
      "@type": "Dataset",
      name: dataset.title,
      identifier: dataset.slug,
      distribution: {
        "@type": "DataDownload",
        encodingFormat: "application/gzip",
        contentUrl: `${siteUrl.replace(/\/$/, "")}/api/exports/download/items/${dataset.slug}`
      }
    }))
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>Download India CPI datasets | Indiainflation</title>
        <meta
          name="description"
          content="Access CPI, WPI, and IMF inflation datasets with regional coverage, YoY, and MoM calculations ready for modelling."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <section className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-8 py-12 text-white shadow-xl">
        <div className="space-y-4 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Datasets</p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Ready-to-use inflation exports</h1>
          <p className="mx-auto max-w-3xl text-sm text-slate-200 md:mx-0">
            Each export ships with regional metadata and derived YoY/MoM calculations so you can plug the JSON straight into dashboards, models, or investor updates.
          </p>
        </div>
        <div className="mt-8 grid gap-4 text-sm md:grid-cols-3">
          <HeroMetric title="Total datasets" value={datasets.length.toString()} caption="CPI, WPI, IMF" />
          <HeroMetric title="Regions covered" value={datasets.reduce((sum, dataset) => sum + dataset.regions, 0).toString()} caption="Nation + states" />
          <HeroMetric
            title="Latest refresh"
            value={safeFormatDate(generatedAt, { year: "numeric", month: "short", day: "numeric" })}
            caption="ETL automation"
          />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {datasets.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500 md:col-span-2">
            Exports are being generated. Please check back after the next ETL refresh.
          </p>
        ) : (
          datasets.map((dataset) => {
            const apiPath = `/api/exports/items/${dataset.slug}`;
            const downloadPath = `/api/exports/download/items/${dataset.slug}`;
            return (
              <article key={dataset.slug} className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{dataset.source}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{dataset.title}</h2>
                <p className="mt-3 text-sm text-slate-600">{dataset.description}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                  <div>
                    <dt>Observations</dt>
                    <dd className="font-semibold text-slate-900">{dataset.count.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Regions</dt>
                    <dd className="font-semibold text-slate-900">{dataset.regions}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt>Latest month</dt>
                    <dd className="font-semibold text-slate-900">
                      {safeFormatDate(dataset.lastDate, { month: "short", year: "numeric" })}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex flex-wrap gap-3 text-sm">
                  <Link className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-500" href={downloadPath}>
                    Download JSON
                  </Link>
                  <Link className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-blue-200" href={apiPath}>
                    API endpoint
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}

function HeroMetric({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-300">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="text-xs text-slate-200/80">{caption}</p>
    </div>
  );
}
