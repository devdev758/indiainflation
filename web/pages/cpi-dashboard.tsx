import clsx from "clsx";
import Head from "next/head";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";

import { CpiTrendChart, type CpiTrendPoint } from "@/components/charts/CpiTrendChart";
import { DATASET_LOOKUP, DASHBOARD_SLUGS } from "@/lib/data/catalog";
import { loadPhase3Items, type Phase3ItemDataset } from "@/lib/data/phase3";
import {
  collectRegionOptions,
  deriveMetricValue,
  getRegionSeries,
  parseDateKey,
  subtractMonths,
  type Phase3MetricKey
} from "@/lib/data/phase3Shared";

const DASHBOARD_SOURCES = DASHBOARD_SLUGS.map((slug) => ({
  slug,
  label: DATASET_LOOKUP[slug]?.title ?? slug,
  color: DATASET_LOOKUP[slug]?.color ?? "#2563eb"
}));

const ITEM_LOOKUP = Object.fromEntries(DASHBOARD_SOURCES.map((item) => [item.slug, item]));

const RANGE_OPTIONS: Array<{ key: string; label: string; months: number | null }> = [
  { key: "5y", label: "5Y", months: 60 },
  { key: "10y", label: "10Y", months: 120 },
  { key: "25y", label: "25Y", months: 300 },
  { key: "max", label: "All", months: null }
];

const METRIC_OPTIONS: Array<{ key: MetricKey; label: string }> = [
  { key: "index", label: "Index" },
  { key: "yoy", label: "YoY %" },
  { key: "mom", label: "WoW % (MoM)" }
];

type MetricKey = Phase3MetricKey;

type DashboardProps = {
  items: Phase3ItemDataset[];
  regions: Array<{ code: string; name: string; type: string }>;
  generatedAt: string;
};

export const getStaticProps: GetStaticProps<DashboardProps> = async () => {
  const items = await loadPhase3Items(DASHBOARD_SOURCES.map((item) => item.slug));
  const regions = collectRegionOptions(items);

  return {
    props: {
      items,
      regions,
      generatedAt: new Date().toISOString()
    },
    revalidate: 300
  };
};

export default function CpiDashboardPage({ items, regions, generatedAt }: InferGetStaticPropsType<typeof getStaticProps>) {
  const availableSlugs = useMemo(() => items.map((item) => item.slug), [items]);
  const [selectedItems, setSelectedItems] = useState<string[]>(() => (availableSlugs.length ? availableSlugs : []));

  const defaultRegion = useMemo(() => {
    const allIndia = regions.find((region) => region.code === "all-india");
    if (allIndia) return allIndia.code;
    if (items[0]) return items[0].defaultRegion;
    return regions[0]?.code ?? "all-india";
  }, [items, regions]);

  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion);
  const [selectedRange, setSelectedRange] = useState<string>("10y");
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("index");

  useEffect(() => {
    setSelectedRegion(defaultRegion);
  }, [defaultRegion]);

  useEffect(() => {
    if (!availableSlugs.length) {
      setSelectedItems([]);
      return;
    }
    setSelectedItems((prev) => {
      const filtered = prev.filter((slug) => availableSlugs.includes(slug));
      return filtered.length ? filtered : availableSlugs;
    });
  }, [availableSlugs]);

  const itemMap = useMemo(() => {
    const map = new Map<string, Phase3ItemDataset>();
    items.forEach((item) => {
      map.set(item.slug, item);
    });
    return map;
  }, [items]);

  const latestDate = useMemo(() => {
    let candidate: Date | null = null;
    selectedItems.forEach((slug) => {
      const item = itemMap.get(slug);
      if (!item) return;
      const regionSeries = getRegionSeries(item, selectedRegion);
      const lastEntry = regionSeries?.series.at(-1);
      if (!lastEntry) return;
      const parsed = parseDateKey(lastEntry.date);
      if (!candidate || parsed > candidate) {
        candidate = parsed;
      }
    });
    return candidate;
  }, [itemMap, selectedItems, selectedRegion]);

  const startDate = useMemo(() => {
    const option = RANGE_OPTIONS.find((entry) => entry.key === selectedRange);
    if (!option || option.months === null || !latestDate) {
      return null;
    }
    return subtractMonths(latestDate, option.months);
  }, [selectedRange, latestDate]);

  const chartSeries = useMemo<CpiTrendPoint[]>(() => {
    const dateMap = new Map<string, CpiTrendPoint>();

    selectedItems.forEach((slug) => {
      const item = itemMap.get(slug);
      if (!item) return;
      const regionData = getRegionSeries(item, selectedRegion);
      regionData?.series.forEach((entry) => {
        const dateKey = entry.date;
        const parsedDate = parseDateKey(dateKey);
        if (startDate && parsedDate < startDate) {
          return;
        }
        const current = dateMap.get(dateKey) ?? { date: dateKey };
        const value = deriveMetricValue(entry, selectedMetric);
        (current as CpiTrendPoint)[slug] = value;
        dateMap.set(dateKey, current as CpiTrendPoint);
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [itemMap, selectedItems, selectedRegion, selectedMetric, startDate]);

  const chartSeriesConfig = useMemo(
    () =>
      selectedItems.map((slug) => ({
        key: slug,
        label: ITEM_LOOKUP[slug]?.label ?? slug,
        color: ITEM_LOOKUP[slug]?.color ?? "#1d4ed8"
      })),
    [selectedItems]
  );

  const metricSummary = useMemo(() => {
    const getLatest = (slug: string, metric: "yoy_pct" | "mom_pct") => {
      const item = itemMap.get(slug);
      if (!item) return null;
      const region = getRegionSeries(item, selectedRegion);
      if (!region) return null;
      for (let index = region.series.length - 1; index >= 0; index -= 1) {
        const entry = region.series[index];
        const value = entry[metric];
        if (value !== null && !Number.isNaN(value)) {
          return value;
        }
      }
      return null;
    };

    const coverage = selectedItems.reduce((max, slug) => {
      const item = itemMap.get(slug);
      const region = item ? getRegionSeries(item, selectedRegion) : null;
      return Math.max(max, region?.metadata.count ?? 0);
    }, 0);

    return {
      cpiHeadlineYoY: getLatest("cpi-all-items", "yoy_pct"),
      cpiFoodYoY: getLatest("cpi-food-and-beverages", "yoy_pct"),
      wpiYoY: getLatest("wpi-all-commodities", "yoy_pct"),
      coverageMonths: coverage
    };
  }, [itemMap, selectedRegion, selectedItems]);

  const valueFormatter = useMemo(() => {
    const formatNumber = (value: number, digits: number, suffix = "") => {
      if (!Number.isFinite(value)) {
        return "--";
      }
      return `${value.toFixed(digits)}${suffix}`;
    };

    if (selectedMetric === "index") {
      return (value: number) => formatNumber(value, 1);
    }
    return (value: number) => formatNumber(value, 2, "%");
  }, [selectedMetric]);

  const regionLabel = useMemo(() => regions.find((region) => region.code === selectedRegion)?.name ?? selectedRegion, [regions, selectedRegion]);
  const selectedLabels = useMemo(() => selectedItems.map((slug) => ITEM_LOOKUP[slug]?.label ?? slug), [selectedItems]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/cpi-dashboard`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Indiainflation CPI dashboard",
    url: canonicalUrl,
    dateModified: generatedAt,
    measurementTechnique: "MOSPI CPI",
    variableMeasured: selectedLabels,
    spatialCoverage: regionLabel
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>India CPI dashboard | Indiainflation</title>
        <meta
          name="description"
          content="Analyse long-run CPI and WPI trends across Indian regions with interactive time ranges, YoY/WoW toggles, and export-ready datasets."
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
            Long-run CPI and WPI coverage for analysts, founders, and policymakers. Choose regional slices, switch between YoY or WoW (MoM) views, and download structured data for modelling.
          </p>
        </div>
        <div className="mt-6 grid gap-4 text-sm md:grid-cols-4">
          <MetricCard title="Headline CPI YoY" value={formatMaybePercent(metricSummary.cpiHeadlineYoY)} />
          <MetricCard title="Food CPI YoY" value={formatMaybePercent(metricSummary.cpiFoodYoY)} />
          <MetricCard title="WPI YoY" value={formatMaybePercent(metricSummary.wpiYoY)} />
          <MetricCard title="Months of coverage" value={metricSummary.coverageMonths.toLocaleString()} />
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-blue-100">Viewing: {regionLabel}</p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedRange(option.key)}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  selectedRange === option.key
                    ? "bg-blue-600 text-white shadow"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="text-slate-500" htmlFor="dashboard-region">
              Region
            </label>
            <select
              id="dashboard-region"
              value={selectedRegion}
              onChange={(event) => setSelectedRegion(event.target.value)}
              className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {regions.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name} {region.type !== "nation" ? `(${region.type})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            {METRIC_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setSelectedMetric(option.key)}
                className={clsx(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  selectedMetric === option.key
                    ? "bg-slate-900 text-white shadow"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {chartSeries.length > 0 ? (
            <CpiTrendChart
              data={chartSeries}
              series={chartSeriesConfig}
              valueFormatter={valueFormatter}
              yAxisFormatter={(value) => valueFormatter(Number(value))}
              variant="bare"
              height={360}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500">
              No data available for the selected configuration.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {availableSlugs.map((slug) => {
            const item = ITEM_LOOKUP[slug];
            const isActive = selectedItems.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleItemSelection(slug, setSelectedItems)}
                className={clsx(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  isActive ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
                aria-pressed={isActive}
              >
                <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: item?.color ?? "#2563eb" }} />
                {item?.label ?? slug}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm text-sm text-slate-600">
        <h2 className="text-xl font-semibold text-slate-900">How to use this dashboard</h2>
        <ul className="mt-3 list-disc space-y-2 pl-4">
          <li>Shift between national and state-level CPI in one click to surface divergence.</li>
          <li>Toggle YoY vs WoW (MoM) to understand momentum before official commentary lands.</li>
          <li>Use the compare page for multi-item overlays and export JSON/CSV snapshots for modelling.</li>
        </ul>
      </section>
    </div>
  );
}

function toggleItemSelection(slug: string, setSelected: Dispatch<SetStateAction<string[]>>) {
  setSelected((prev) => {
    if (prev.includes(slug)) {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((value) => value !== slug);
    }
    return [...prev, slug];
  });
}

function formatMaybePercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }
  return `${value.toFixed(2)}%`;
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-blue-100">{title}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
