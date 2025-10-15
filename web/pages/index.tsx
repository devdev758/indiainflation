import Head from "next/head";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import InflationConverter from "@/components/InflationConverter";
import LatestCPIWidget from "@/components/LatestCPIWidget";
import { LatestArticlesGrid } from "@/components/articles/LatestArticlesGrid";
import { CpiTrendChart, type CpiTrendPoint } from "@/components/charts/CpiTrendChart";
import { CpiComparisonTool } from "@/components/calculators/CpiComparisonTool";
import { YoYCalculator } from "@/components/calculators/YoYCalculator";
import { FooterSection } from "@/components/layout/FooterSection";
import { HeroSection } from "@/components/layout/HeroSection";
import {
  COMPARISON_SLUGS,
  DATASET_DEFINITIONS,
  DATASET_LOOKUP,
  HOME_TREND_SLUGS,
  YOY_SLUGS
} from "@/lib/data/catalog";
import { collectRegionOptions, getRegionSeries, type Phase3ItemDataset } from "@/lib/data/phase3Shared";
import { loadPhase3Items } from "@/lib/data/phase3";
import { fetchPosts, type PostSummary } from "@/lib/wpClient";

type HomeProps = {
  posts: PostSummary[];
  trendData: CpiTrendPoint[];
  comparisonDatasets: Phase3ItemDataset[];
  comparisonRegions: Array<{ code: string; name: string; type: string }>;
  tickerItems: TickerItem[];
  metricCards: MetricCard[];
  datasetSummaries: DatasetSummary[];
  topMovers: TrendCard[];
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const [posts, datasets] = await Promise.all([
      fetchPosts({ per_page: 6, page: 1 }),
      loadPhase3Items(
        Array.from(
          new Set([
            ...HOME_TREND_SLUGS,
            ...YOY_SLUGS,
            ...COMPARISON_SLUGS,
            ...DATASET_DEFINITIONS.map((entry) => entry.slug)
          ])
        )
      )
    ]);

    const datasetMap = new Map(datasets.map((dataset) => [dataset.slug, dataset] as const));
    const comparisonDatasets = COMPARISON_SLUGS.map((slug) => datasetMap.get(slug)).filter(Boolean) as Phase3ItemDataset[];
    const trendDatasets = HOME_TREND_SLUGS.map((slug) => datasetMap.get(slug)).filter(Boolean) as Phase3ItemDataset[];
    const comparisonRegions = collectRegionOptions(comparisonDatasets);
    const trendData = buildTrendDataset(trendDatasets);

    const tickerItems = buildTickerItems(datasetMap);
    const metricCards = buildMetricCards(datasetMap);
    const datasetSummaries = buildDatasetSummaries(datasetMap);
    const topMovers = buildTopMovers(datasetMap);

    return {
      props: { posts, trendData, comparisonDatasets, comparisonRegions, tickerItems, metricCards, datasetSummaries, topMovers },
      revalidate: 300
    };
  } catch (error) {
    console.error("homepage posts fetch failed", error);
    return {
      props: {
        posts: [],
        trendData: [],
        comparisonDatasets: [],
        comparisonRegions: [],
        tickerItems: [],
        metricCards: [],
        datasetSummaries: [],
        topMovers: []
      },
      revalidate: 300
    };
  }
};

export default function Home({
  posts,
  trendData,
  comparisonDatasets,
  comparisonRegions,
  tickerItems,
  metricCards,
  datasetSummaries,
  topMovers
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/`;
  const ogImage = `${siteUrl.replace(/\/$/, "")}/api/og?title=${encodeURIComponent("India Inflation Calculator")}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Indiainflation",
    url: siteUrl,
    description:
      "Explore India’s inflation trends, convert historical prices, and read CPI analysis with Indiainflation calculators and dashboards.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/items/{search_term}`,
      "query-input": "required name=search_term"
    }
  };

  return (
    <>
      <Head>
        <title>India Inflation Calculator & CPI Insights | Indiainflation</title>
        <meta
          name="description"
          content="Explore India’s inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Indiainflation" />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="India Inflation Calculator & CPI Insights" />
        <meta
          name="twitter:description"
          content="Explore India’s inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts."
        />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 pt-10 md:px-6">
        <HeroSection
          eyebrow="Trusted inflation intelligence for India"
          title="India Inflation Calculator"
          description="Analyse consumer price changes, compare essential items, and translate historic rupee amounts into today’s terms with live CPI data."
          primaryCta={{ href: "/calculators", label: "Explore calculators" }}
          secondaryCta={{ href: "/articles", label: "Read latest articles" }}
          highlight={<LatestCPIWidget />}
          calculator={<InflationConverter />}
        />

        {tickerItems.length ? (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 md:flex-nowrap">
              {tickerItems.map((item) => (
                <div key={item.label} className="min-w-[140px] flex-1">
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
                  <p className="text-xs text-slate-500">{item.caption}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <CpiTrendChart
            data={trendData}
            series={HOME_TREND_SLUGS.map((slug) => ({
              key: slug,
              label: DATASET_LOOKUP[slug]?.title ?? slug,
              color: DATASET_LOOKUP[slug]?.color ?? "#2563eb"
            }))}
            variant="card"
          />
          <div className="grid gap-6">
            <YoYCalculator />
            <CpiComparisonTool datasets={comparisonDatasets} regions={comparisonRegions} />
          </div>
        </section>

        {metricCards.length ? (
          <section className="grid gap-4 md:grid-cols-3">
            {metricCards.map((card) => (
              <div key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-wide text-slate-500">{card.title}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
                <p className="mt-1 text-sm text-slate-500">{card.caption}</p>
              </div>
            ))}
          </section>
        ) : null}

        {topMovers.length ? (
          <section className="grid gap-4 md:grid-cols-3">
            {topMovers.map((card) => (
              <article key={card.slug} className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: DATASET_LOOKUP[card.slug]?.color ?? "#2563eb" }}>
                  {card.category}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.summary}</p>
              </article>
            ))}
          </section>
        ) : null}

        <LatestArticlesGrid posts={posts} />

        {datasetSummaries.length ? (
          <section className="space-y-6">
            <header className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">Datasets</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Download-ready CPI & WPI exports</h2>
              <p className="mt-2 text-sm text-slate-600">
                Every export ships with regional metadata, YoY/MoM calculations, and JSON endpoints for integration.
              </p>
            </header>
            <div className="grid gap-6 md:grid-cols-2">
              {datasetSummaries.map((dataset) => (
                <article key={dataset.slug} className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-blue-500">{dataset.source}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-900">{dataset.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{dataset.description}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-600">
                    <div>
                      <dt className="text-slate-500">Observations</dt>
                      <dd className="font-semibold text-slate-900">{dataset.observations.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Regions</dt>
                      <dd className="font-semibold text-slate-900">{dataset.regions}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500">Latest month</dt>
                      <dd className="font-semibold text-slate-900">{dataset.latestMonth ?? "--"}</dd>
                    </div>
                  </dl>
                  <div className="mt-5 flex flex-wrap gap-3 text-sm">
                    <a className="rounded-full bg-blue-600 px-4 py-2 font-semibold text-white shadow hover:bg-blue-500" href={`/api/exports/download/items/${dataset.slug}`}>
                      Download JSON
                    </a>
                    <a className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:border-blue-200" href={`/api/exports/items/${dataset.slug}`}>
                      API endpoint
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <FooterSection />
      </div>
    </>
  );
}

function buildTrendDataset(datasets: Phase3ItemDataset[]): CpiTrendPoint[] {
  const dateMap = new Map<string, CpiTrendPoint>();

  datasets.forEach((dataset) => {
    const region = getRegionSeries(dataset, dataset.defaultRegion);
    if (!region) return;
    region.series.forEach((entry) => {
      if (!entry.date) return;
      const current = dateMap.get(entry.date) ?? { date: entry.date };
      current[dataset.slug] = Number.isFinite(entry.index_value ?? NaN) ? entry.index_value : null;
      dateMap.set(entry.date, current);
    });
  });

  return Array.from(dateMap.values())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-24) as CpiTrendPoint[];
}

type TickerItem = {
  label: string;
  value: string;
  caption: string;
};

type MetricCard = {
  title: string;
  value: string;
  caption: string;
};

type DatasetSummary = {
  slug: string;
  title: string;
  description: string;
  source: string;
  observations: number;
  latestMonth: string | null;
  regions: number;
};

type TrendCard = {
  slug: string;
  title: string;
  summary: string;
  category: string;
};

function getLatestEntry(dataset: Phase3ItemDataset | undefined) {
  if (!dataset) return null;
  const region = getRegionSeries(dataset, dataset.defaultRegion);
  if (!region) return null;
  const entry = region.series.at(-1);
  if (!entry) return null;
  return { entry, metadata: region.metadata };
}

function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

function formatIndex(value: number | null | undefined, digits = 1): string {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }
  return value.toFixed(digits);
}

function buildTickerItems(datasetMap: Map<string, Phase3ItemDataset>): TickerItem[] {
  const headline = getLatestEntry(datasetMap.get("cpi-all-items"));
  const food = getLatestEntry(datasetMap.get("cpi-food-and-beverages"));
  const wpi = getLatestEntry(datasetMap.get("wpi-all-commodities"));

  const monthLabel = (entry: ReturnType<typeof getLatestEntry>) => entry?.entry.date ?? "--";

  return [
    {
      label: "Headline CPI YoY",
      value: formatPercent(headline?.entry.yoy_pct),
      caption: monthLabel(headline)
    },
    {
      label: "Food CPI YoY",
      value: formatPercent(food?.entry.yoy_pct),
      caption: monthLabel(food)
    },
    {
      label: "WPI YoY",
      value: formatPercent(wpi?.entry.yoy_pct),
      caption: monthLabel(wpi)
    }
  ];
}

function buildMetricCards(datasetMap: Map<string, Phase3ItemDataset>): MetricCard[] {
  const headline = getLatestEntry(datasetMap.get("cpi-all-items"));
  const fuel = getLatestEntry(datasetMap.get("cpi-fuel-and-light"));
  const wpi = getLatestEntry(datasetMap.get("wpi-all-commodities"));

  return [
    {
      title: "Headline CPI Index",
      value: formatIndex(headline?.entry.index_value),
      caption: `${formatPercent(headline?.entry.yoy_pct)} YoY`
    },
    {
      title: "Fuel & Light CPI",
      value: formatIndex(fuel?.entry.index_value),
      caption: `${formatPercent(fuel?.entry.yoy_pct)} YoY`
    },
    {
      title: "WPI Index",
      value: formatIndex(wpi?.entry.index_value),
      caption: `${formatPercent(wpi?.entry.yoy_pct)} YoY`
    }
  ];
}

function buildDatasetSummaries(datasetMap: Map<string, Phase3ItemDataset>): DatasetSummary[] {
  return DATASET_DEFINITIONS.map((definition) => {
    const dataset = datasetMap.get(definition.slug);
    const region = dataset ? getRegionSeries(dataset, dataset.defaultRegion) : null;
    const latest = region?.series.at(-1)?.date ?? null;
    const observations = region?.metadata.count ?? region?.series.length ?? 0;
    const regions = dataset?.regions.length ?? 0;
    return {
      slug: definition.slug,
      title: definition.title,
      description: definition.description,
      source: definition.source,
      observations,
      latestMonth: latest,
      regions
    };
  });
}

function buildTopMovers(datasetMap: Map<string, Phase3ItemDataset>): TrendCard[] {
  const entries = YOY_SLUGS.map((slug) => {
    const dataset = datasetMap.get(slug);
    const latest = getLatestEntry(dataset);
    const previous = dataset ? getRegionSeries(dataset, dataset.defaultRegion)?.series.at(-2) : null;
    return {
      slug,
      latest,
      previous,
      definition: DATASET_LOOKUP[slug]
    };
  }).filter((item) => item.latest?.entry.yoy_pct != null);

  entries.sort((a, b) => (Math.abs((b.latest?.entry.yoy_pct ?? 0)) - Math.abs((a.latest?.entry.yoy_pct ?? 0))));

  return entries.slice(0, 3).map((item) => {
    const yoy = formatPercent(item.latest?.entry.yoy_pct);
    const mom = formatPercent(item.latest?.entry.mom_pct, 2);
    const changeLabel = item.previous?.yoy_pct != null && item.latest?.entry.yoy_pct != null
      ? formatPercent(item.latest?.entry.yoy_pct - item.previous.yoy_pct, 2)
      : "--";
    return {
      slug: item.slug,
      title: item.definition?.title ?? item.slug,
      category: item.definition?.source ?? "CPI",
      summary: `${yoy} YoY • ${mom} MoM • Δ YoY ${changeLabel}`
    };
  });
}
