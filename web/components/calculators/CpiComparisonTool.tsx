'use client';

import clsx from "clsx";
import { useEffect, useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from "react";

import { CpiTrendChart, type CpiTrendPoint } from "@/components/charts/CpiTrendChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deriveMetricValue,
  getRegionSeries,
  parseDateKey,
  subtractMonths,
  type Phase3ItemDataset,
  type Phase3MetricKey
} from "@/lib/data/phase3Shared";

const RANGE_OPTIONS: Array<{ key: string; label: string; months: number | null }> = [
  { key: "5y", label: "5Y", months: 60 },
  { key: "10y", label: "10Y", months: 120 },
  { key: "25y", label: "25Y", months: 300 },
  { key: "max", label: "All", months: null }
];

const METRIC_OPTIONS: Array<{ key: Phase3MetricKey; label: string }> = [
  { key: "index", label: "Index" },
  { key: "yoy", label: "YoY %" },
  { key: "mom", label: "WoW % (MoM)" }
];

const FALLBACK_COLORS = ["#2563eb", "#f97316", "#10b981", "#9333ea", "#ef4444", "#14b8a6"];

type CpiComparisonToolProps = {
  datasets: Phase3ItemDataset[];
  regions: Array<{ code: string; name: string; type: string }>;
};

export function CpiComparisonTool({ datasets, regions }: CpiComparisonToolProps): ReactElement {
  const datasetMap = useMemo(() => {
    const map = new Map<string, Phase3ItemDataset>();
    datasets.forEach((dataset) => {
      map.set(dataset.slug, dataset);
    });
    return map;
  }, [datasets]);

  const availableSlugs = useMemo(() => datasets.map((dataset) => dataset.slug), [datasets]);

  const colorMap = useMemo(() => {
    const map = new Map<string, string>();
    availableSlugs.forEach((slug, index) => {
      map.set(slug, FALLBACK_COLORS[index % FALLBACK_COLORS.length]);
    });
    return map;
  }, [availableSlugs]);

  const defaultSelected = useMemo(() => availableSlugs.slice(0, 3), [availableSlugs]);
  const defaultRegion = useMemo(() => {
    const allIndia = regions.find((region) => region.code === "all-india");
    if (allIndia) return allIndia.code;
    if (datasets[0]) return datasets[0].defaultRegion;
    return regions[0]?.code ?? "all-india";
  }, [datasets, regions]);

  const [selectedItems, setSelectedItems] = useState<string[]>(defaultSelected);
  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion);
  const [selectedRange, setSelectedRange] = useState<string>("10y");
  const [selectedMetric, setSelectedMetric] = useState<Phase3MetricKey>("index");
  const [normalise, setNormalise] = useState<boolean>(false);

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
      return filtered.length ? filtered : availableSlugs.slice(0, 3);
    });
  }, [availableSlugs]);

  useEffect(() => {
    if (selectedMetric !== "index" && normalise) {
      setNormalise(false);
    }
  }, [selectedMetric, normalise]);

  const latestDate = useMemo(() => {
    let candidate: Date | null = null;
    selectedItems.forEach((slug) => {
      const dataset = datasetMap.get(slug);
      if (!dataset) return;
      const regionSeries = getRegionSeries(dataset, selectedRegion);
      const lastEntry = regionSeries?.series.at(-1);
      if (!lastEntry) return;
      const parsed = parseDateKey(lastEntry.date);
      if (!candidate || parsed > candidate) {
        candidate = parsed;
      }
    });
    return candidate;
  }, [datasetMap, selectedItems, selectedRegion]);

  const startDate = useMemo(() => {
    const option = RANGE_OPTIONS.find((entry) => entry.key === selectedRange);
    if (!option || option.months === null || !latestDate) {
      return null;
    }
    return subtractMonths(latestDate, option.months);
  }, [selectedRange, latestDate]);

  const chartData = useMemo<CpiTrendPoint[]>(() => {
    const dateMap = new Map<string, CpiTrendPoint>();

    selectedItems.forEach((slug) => {
      const dataset = datasetMap.get(slug);
      if (!dataset) return;
      const regionData = getRegionSeries(dataset, selectedRegion);
      if (!regionData) return;
      let baseValue: number | null = null;

      regionData.series.forEach((entry) => {
        const parsedDate = parseDateKey(entry.date);
        if (startDate && parsedDate < startDate) {
          return;
        }

        const rawValue = deriveMetricValue(entry, selectedMetric);
        let value = rawValue;

        if (selectedMetric === "index" && normalise) {
          if (rawValue === null) {
            value = null;
          } else {
            if (baseValue === null) {
              baseValue = rawValue === 0 ? null : rawValue;
            }
            value = baseValue ? (rawValue / baseValue) * 100 : null;
          }
        }

        const point = dateMap.get(entry.date) ?? { date: entry.date };
        (point as CpiTrendPoint)[slug] = value;
        dateMap.set(entry.date, point as CpiTrendPoint);
      });
    });

    return Array.from(dateMap.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [datasetMap, selectedItems, selectedRegion, selectedMetric, startDate, normalise]);

  const seriesConfig = useMemo(() => {
    return selectedItems.map((slug) => {
      const dataset = datasetMap.get(slug);
      const color = colorMap.get(slug) ?? FALLBACK_COLORS[0];
      return {
        key: slug,
        label: dataset?.name ?? slug,
        color
      };
    });
  }, [datasetMap, selectedItems, colorMap]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>CPI comparison</CardTitle>
        <CardDescription>
          Overlay CPI, WPI, and IMF-derived price indices by region. Adjust the horizon, toggle YoY vs WoW (MoM), or normalise to a common base for relative spreads.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
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
            <label className="text-slate-500" htmlFor="comparison-region">
              Region
            </label>
            <select
              id="comparison-region"
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

        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <label className={clsx("flex items-center gap-2", selectedMetric !== "index" ? "opacity-50" : "")}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={normalise}
              onChange={(event) => setNormalise(event.target.checked)}
              disabled={selectedMetric !== "index"}
            />
            <span>Normalise to base 100</span>
          </label>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">{regionLabel}</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
          {chartData.length > 0 ? (
            <CpiTrendChart
              data={chartData}
              series={seriesConfig}
              valueFormatter={valueFormatter}
              yAxisFormatter={(value) => valueFormatter(Number(value))}
              variant="bare"
              height={360}
            />
          ) : (
            <div className="flex h-80 items-center justify-center text-sm text-slate-500">Not enough data for the selected filters.</div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {availableSlugs.map((slug) => {
            const dataset = datasetMap.get(slug);
            const isActive = selectedItems.includes(slug);
            const color = colorMap.get(slug) ?? FALLBACK_COLORS[0];
            return (
              <button
                key={slug}
                type="button"
                onClick={() => toggleItem(slug, setSelectedItems)}
                className={clsx(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                  isActive ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
                aria-pressed={isActive}
              >
                <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                {dataset?.name ?? slug}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function toggleItem(slug: string, setSelectedItems: Dispatch<SetStateAction<string[]>>) {
  setSelectedItems((prev) => {
    if (prev.includes(slug)) {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((value) => value !== slug);
    }
    return [...prev, slug];
  });
}
