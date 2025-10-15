'use client';

import clsx from "clsx";
import { useEffect, useMemo, useState, type Dispatch, type ReactElement, type SetStateAction } from "react";

import { CpiTrendChart, type CpiTrendPoint } from "@/components/charts/CpiTrendChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DATASET_DEFINITIONS } from "@/lib/data/catalog";
import type { ItemExportData } from "@/lib/exportLoader";
import { useItemExports } from "@/lib/client/useItemExports";

type RegionOption = {
  code: string;
  name: string;
  type: string;
};

const STATE_COLOR_PALETTE = ["#2563eb", "#f97316", "#10b981", "#7c3aed", "#ef4444", "#6366f1"];

const DATASET_OPTIONS = DATASET_DEFINITIONS.filter((entry) => entry.category !== "imf");

function buildTrendPoints(regions: RegionOption[], data: ItemExportData | null, selectedRegions: string[]): CpiTrendPoint[] {
  if (!data) return [];
  const regionSeries = data.regional_series ?? [];
  const regionMap = new Map(regionSeries.map((entry) => [entry.code, entry.series]));
  const dateMap = new Map<string, CpiTrendPoint>();

  selectedRegions.forEach((code) => {
    const series = regionMap.get(code);
    if (!series) return;
    series.forEach((entry) => {
      const point = dateMap.get(entry.date) ?? { date: entry.date };
      (point as CpiTrendPoint)[code] = entry.index_value ?? null;
      dateMap.set(entry.date, point as CpiTrendPoint);
    });
  });

  return Array.from(dateMap.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
}

function RegionToggle({
  option,
  isActive,
  onToggle,
  color,
}: {
  option: RegionOption;
  isActive: boolean;
  onToggle: Dispatch<SetStateAction<string[]>>;
  color: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onToggle((prev) => {
          if (prev.includes(option.code)) {
            if (prev.length === 1) return prev;
            return prev.filter((entry) => entry !== option.code);
          }
          if (prev.length >= 4) {
            return [...prev.slice(1), option.code];
          }
          return [...prev, option.code];
        })
      }
      className={clsx(
        "flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition",
        isActive ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      )}
      aria-pressed={isActive}
    >
      <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {option.name}
    </button>
  );
}

export function StateComparisonChart(): ReactElement {
  const [dataset, setDataset] = useState<string>(DATASET_OPTIONS[0]?.slug ?? "cpi-all-items");
  const { data, loading, error } = useItemExports([dataset]);
  const exportData = data[dataset] ?? null;

  const stateRegions = useMemo<RegionOption[]>(() => {
    if (!exportData?.regional_series) return [];
    return exportData.regional_series
      .filter((entry) => entry.type === "state")
      .map((entry) => ({ code: entry.code, name: entry.name, type: entry.type }));
  }, [exportData]);

  const [selectedRegions, setSelectedRegions] = useState<string[]>(() => stateRegions.slice(0, 4).map((entry) => entry.code));

  useEffect(() => {
    setSelectedRegions((prev) => {
      if (!stateRegions.length) return [];
      if (!prev.length) return stateRegions.slice(0, 4).map((entry) => entry.code);
      const retained = prev.filter((code) => stateRegions.some((region) => region.code === code));
      if (retained.length === 0) {
        return stateRegions.slice(0, 4).map((entry) => entry.code);
      }
      return retained;
    });
  }, [stateRegions]);

  const trendData = useMemo(() => buildTrendPoints(stateRegions, exportData, selectedRegions), [stateRegions, exportData, selectedRegions]);

  const datasetDefinition = DATASET_DEFINITIONS.find((entry) => entry.slug === dataset);
  const colorLookup = stateRegions.reduce<Record<string, string>>((acc, region, index) => {
    acc[region.code] = STATE_COLOR_PALETTE[index % STATE_COLOR_PALETTE.length];
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>State-wise CPI comparison</CardTitle>
        <CardDescription>Select a CPI basket and overlay up to four states to surface regional divergence across India.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="state-dataset" className="text-sm text-slate-600">
            Dataset
          </label>
          <select
            id="state-dataset"
            value={dataset}
            onChange={(event) => setDataset(event.target.value)}
            className="h-10 rounded-full border border-slate-200 bg-white px-4 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {DATASET_OPTIONS.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.title}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load regional CPI data.</p>
        ) : loading ? (
          <p className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500">Loading regional CPI series…</p>
        ) : trendData.length ? (
          <CpiTrendChart
            data={trendData}
            series={selectedRegions.map((code) => ({
              key: code,
              label: stateRegions.find((region) => region.code === code)?.name ?? code,
              color: colorLookup[code] ?? "#2563eb",
            }))}
            valueFormatter={(value) => value.toFixed(1)}
            yAxisFormatter={(value) => value.toFixed(0)}
            title={datasetDefinition?.title}
            description={datasetDefinition?.description ?? "State CPI comparison"}
            height={360}
          />
        ) : (
          <p className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500">No regional series available for this dataset.</p>
        )}

        <div className="flex flex-wrap gap-2">
          {stateRegions.map((region, index) => (
            <RegionToggle
              key={region.code}
              option={region}
              isActive={selectedRegions.includes(region.code)}
              onToggle={setSelectedRegions}
              color={colorLookup[region.code] ?? STATE_COLOR_PALETTE[index % STATE_COLOR_PALETTE.length]}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
