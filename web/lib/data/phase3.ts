import { loadItemExport, type ItemExportData } from "@/lib/exportLoader";

import {
  collectRegionOptions,
  deriveMetricValue,
  getRegionSeries,
  parseDateKey,
  subtractMonths,
  type Phase3ItemDataset,
  type Phase3Metadata,
  type Phase3MetricKey,
  type Phase3RegionSeries,
  type Phase3SeriesPoint
} from "./phase3Shared";

function toSeriesPoint(entry: { date: string; index_value: number | null; yoy_pct: number | null; mom_pct: number | null }): Phase3SeriesPoint {
  return {
    date: entry.date,
    index_value: entry.index_value ?? null,
    yoy_pct: entry.yoy_pct ?? null,
    mom_pct: entry.mom_pct ?? null
  };
}

function toMetadata(metadata: ItemExportData["metadata"] | undefined): Phase3Metadata {
  return {
    first_date: metadata?.first_date ?? null,
    last_date: metadata?.last_date ?? null,
    count: metadata?.count ?? 0,
    last_index_value: metadata?.last_index_value ?? null,
    average_index_value: metadata?.average_index_value ?? null
  };
}

function buildRegionSeries(code: string, name: string, type: string, series: Phase3SeriesPoint[], metadata: Phase3Metadata): Phase3RegionSeries {
  return {
    code,
    name,
    type,
    metadata,
    series
  };
}

function normaliseItemExport(data: ItemExportData): Phase3ItemDataset {
  const defaultRegion = data.default_region ?? data.regions?.[0]?.code ?? "all-india";
  const baseSeries = data.series?.map(toSeriesPoint) ?? [];
  const baseMetadata = toMetadata(data.metadata);

  const regionalSeriesList: Phase3RegionSeries[] = [];
  const regionMap: Record<string, Phase3RegionSeries> = {};

  if (Array.isArray(data.regional_series) && data.regional_series.length > 0) {
    data.regional_series.forEach((item) => {
      const series = item.series?.map(toSeriesPoint) ?? [];
      const metadata = toMetadata(item.metadata ?? data.metadata);
      const region = buildRegionSeries(item.code, item.name, item.type, series, metadata);
      regionalSeriesList.push(region);
      regionMap[item.code] = region;
    });
  }

  if (regionalSeriesList.length === 0) {
    const fallback = buildRegionSeries(
      defaultRegion,
      data.regions?.[0]?.name ?? data.name,
      data.regions?.[0]?.type ?? "unknown",
      baseSeries,
      baseMetadata
    );
    regionalSeriesList.push(fallback);
    regionMap[fallback.code] = fallback;
  }

  if (!regionMap[defaultRegion]) {
    const meta = data.regions?.find((region) => region.code === defaultRegion);
    const fallback = buildRegionSeries(
      defaultRegion,
      meta?.name ?? regionalSeriesList[0]?.name ?? data.name,
      meta?.type ?? regionalSeriesList[0]?.type ?? "unknown",
      baseSeries,
      baseMetadata
    );
    regionalSeriesList.push(fallback);
    regionMap[defaultRegion] = fallback;
  }

  const orderedRegions = regionalSeriesList.slice().sort((a, b) => a.code.localeCompare(b.code));
  const orderedMap: Record<string, Phase3RegionSeries> = {};
  orderedRegions.forEach((region) => {
    orderedMap[region.code] = region;
  });

  return {
    slug: data.slug,
    name: data.name,
    metadata: baseMetadata,
    defaultRegion: orderedMap[defaultRegion]?.code ?? orderedRegions[0].code,
    regions: orderedRegions,
    regionMap: orderedMap
  };
}

export async function loadPhase3Items(slugs: string[]): Promise<Phase3ItemDataset[]> {
  const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));
  const items: Phase3ItemDataset[] = [];

  for (const slug of uniqueSlugs) {
    try {
      const { data } = await loadItemExport(slug, true);
      items.push(normaliseItemExport(data));
    } catch (error) {
      console.error(`Failed to load phase 3 dataset for ${slug}`, error);
    }
  }

  return items;
}

export { collectRegionOptions, deriveMetricValue, getRegionSeries, parseDateKey, subtractMonths };
export type { Phase3ItemDataset, Phase3Metadata, Phase3MetricKey, Phase3RegionSeries, Phase3SeriesPoint };
