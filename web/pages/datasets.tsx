import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import { loadItemExport, type ItemExportData } from "@/lib/exportLoader";

interface DatasetSummary {
  slug: string;
  title: string;
  description: string;
  count: number;
  lastDate: string | null;
}

type DatasetsPageProps = {
  datasets: DatasetSummary[];
  generatedAt: string;
};

async function fetchExportSummary(slug: string, description: string): Promise<DatasetSummary | null> {
  try {
    const exportResult = await loadItemExport(slug, true);
    const data: ItemExportData = exportResult.data;
    const fallbackItem = (data as unknown as { item?: { slug?: string; name?: string } }).item ?? {};
    const derivedSlug = data.slug ?? fallbackItem.slug ?? slug;
    const title = data.name ?? fallbackItem.name ?? slug;
    if (!derivedSlug) {
      return null;
    }
    return {
      slug: derivedSlug,
      title,
      description,
      count: data.metadata?.count ?? data.series?.length ?? 0,
      lastDate: data.metadata?.last_date ?? data.series?.at?.(-1)?.date ?? null
    };
  } catch (error) {
    console.error(`failed to load dataset export for ${slug}`, error);
    return null;
  }
}

export const getStaticProps: GetStaticProps<DatasetsPageProps> = async () => {
  const summaries = await Promise.all([
    fetchExportSummary("milk", "Monthly CPI index for milk with YoY and MoM changes."),
    fetchExportSummary("rice", "Monthly CPI index for rice for all India households.")
  ]);

  return {
    props: {
      datasets: summaries.filter((value): value is DatasetSummary => Boolean(value)),
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
    <div className="mx-auto max-w-5xl space-y-12 px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>Download India CPI datasets | Indiainflation</title>
        <meta
          name="description"
          content="Access ready-to-use CPI exports for India, including official basket items with metadata, YoY, and MoM calculations."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <section className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-500">Datasets</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Ready-to-use CPI exports
        </h1>
        <p className="mx-auto max-w-3xl text-sm text-slate-600">
          Each download includes metadata (source, frequency, base year) and derived YoY/MoM calculations to accelerate dashboards and analysis.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {datasets.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-500 md:col-span-2">
            CPI exports are being generated. Please check back after the next ETL run.
          </p>
        ) : (
          datasets.map((dataset) => {
            const apiPath = `/api/exports/items/${dataset.slug}`;
            const downloadPath = `/api/exports/download/items/${dataset.slug}`;
            return (
              <article key={dataset.slug} className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Item dataset</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{dataset.title}</h2>
                <p className="mt-3 text-sm text-slate-600">{dataset.description}</p>
                <dl className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <dt>Observations</dt>
                    <dd>{dataset.count.toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Latest month</dt>
                    <dd>{dataset.lastDate ?? "--"}</dd>
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
