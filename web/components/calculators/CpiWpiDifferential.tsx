'use client';

import clsx from "clsx";
import { useMemo, useState, type ReactElement } from "react";

import { CpiTrendChart, type CpiTrendPoint } from "@/components/charts/CpiTrendChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DATASET_LOOKUP } from "@/lib/data/catalog";
import type { ItemExportData } from "@/lib/exportLoader";
import { useItemExports } from "@/lib/client/useItemExports";

const CPI_SLUG = "cpi-all-items";
const WPI_SLUG = "wpi-all-commodities";

type MetricMode = "index" | "yoy";

type SeriesPoint = {
  date: string;
  cpi: number | null;
  wpi: number | null;
  spread: number | null;
};

function buildSeries(data: Record<string, ItemExportData | null>, metric: MetricMode): SeriesPoint[] {
  const cpiSeries = data[CPI_SLUG]?.series ?? [];
  const wpiSeries = data[WPI_SLUG]?.series ?? [];
  const map = new Map<string, { cpi: number | null; wpi: number | null }>();

  cpiSeries.forEach((entry) => {
    const key = entry.date;
    const value = metric === "index" ? entry.index_value : entry.yoy_pct;
    if (!map.has(key)) {
      map.set(key, { cpi: value ?? null, wpi: null });
    } else {
      map.get(key)!.cpi = value ?? null;
    }
  });

  wpiSeries.forEach((entry) => {
    const key = entry.date;
    const value = metric === "index" ? entry.index_value : entry.yoy_pct;
    if (!map.has(key)) {
      map.set(key, { cpi: null, wpi: value ?? null });
    } else {
      map.get(key)!.wpi = value ?? null;
    }
  });

  return Array.from(map.entries())
    .map(([date, values]) => {
      const { cpi, wpi } = values;
      const spread = cpi != null && wpi != null ? cpi - wpi : null;
      return { date, cpi, wpi, spread };
    })
    .sort((a, b) => (a.date > b.date ? 1 : -1));
}

function toTrendPoints(series: SeriesPoint[]): CpiTrendPoint[] {
  return series.map((entry) => ({
    date: entry.date,
    [CPI_SLUG]: entry.cpi,
    [WPI_SLUG]: entry.wpi,
  }));
}

export function CpiWpiDifferential(): ReactElement {
  const [metric, setMetric] = useState<MetricMode>("index");
  const { data, loading, error } = useItemExports([CPI_SLUG, WPI_SLUG]);

  const series = useMemo(() => buildSeries(data, metric), [data, metric]);
  const trendData = useMemo(() => toTrendPoints(series), [series]);
  const latest = series.at(-1);

  const cpiLabel = DATASET_LOOKUP[CPI_SLUG]?.title ?? "CPI";
  const wpiLabel = DATASET_LOOKUP[WPI_SLUG]?.title ?? "WPI";

  const spreadLabel = metric === "index" ? "Index spread" : "YoY spread";
  const spreadUnit = metric === "index" ? "pts" : "pp";
  const formatValue = (value: number | null) => (value != null && Number.isFinite(value) ? value.toFixed(metric === "index" ? 1 : 2) : "--");

  return (
    <Card>
      <CardHeader>
        <CardTitle>CPI vs WPI differential</CardTitle>
        <CardDescription>Track the spread between headline CPI and wholesale prices. Toggle between index levels and YoY change to monitor pressure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {(["index", "yoy"] as MetricMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMetric(option)}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                metric === option ? "bg-blue-600 text-white shadow" : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300"
              )}
            >
              {option === "index" ? "Index" : "YoY %"}
            </button>
          ))}
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load CPI/WPI data right now.</p>
        ) : loading ? (
          <p className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500">Loading CPI vs WPI spread…</p>
        ) : (
          <CpiTrendChart
            data={trendData}
            series={[
              { key: CPI_SLUG, label: cpiLabel, color: DATASET_LOOKUP[CPI_SLUG]?.color ?? "#2563eb" },
              { key: WPI_SLUG, label: wpiLabel, color: DATASET_LOOKUP[WPI_SLUG]?.color ?? "#f97316" }
            ]}
            valueFormatter={(value) => (metric === "index" ? value.toFixed(1) : `${value.toFixed(2)}%`)}
            yAxisFormatter={(value) => (metric === "index" ? value.toFixed(0) : `${value.toFixed(1)}%`)}
            height={340}
            variant="bare"
          />
        )}

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-600 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{cpiLabel}</p>
            <p className="text-2xl font-semibold text-slate-900">{formatValue(latest?.cpi)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{wpiLabel}</p>
            <p className="text-2xl font-semibold text-slate-900">{formatValue(latest?.wpi)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{spreadLabel}</p>
            <p className="text-2xl font-semibold text-blue-600">{formatValue(latest?.spread)} {spreadUnit}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
