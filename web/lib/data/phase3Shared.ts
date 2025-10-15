export type Phase3Metadata = {
  first_date: string | null;
  last_date: string | null;
  count: number;
  last_index_value: number | null;
  average_index_value: number | null;
};

export type Phase3SeriesPoint = {
  date: string;
  index_value: number | null;
  yoy_pct: number | null;
  mom_pct: number | null;
};

export type Phase3RegionSeries = {
  code: string;
  name: string;
  type: string;
  metadata: Phase3Metadata;
  series: Phase3SeriesPoint[];
};

export type Phase3ItemDataset = {
  slug: string;
  name: string;
  metadata: Phase3Metadata;
  defaultRegion: string;
  regions: Phase3RegionSeries[];
  regionMap: Record<string, Phase3RegionSeries>;
};

export type Phase3MetricKey = "index" | "yoy" | "mom";

export function deriveMetricValue(entry: Phase3RegionSeries["series"][number], metric: Phase3MetricKey): number | null {
  if (metric === "index") {
    return entry.index_value ?? null;
  }
  if (metric === "yoy") {
    return entry.yoy_pct ?? null;
  }
  return entry.mom_pct ?? null;
}

export function parseDateKey(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function subtractMonths(date: Date, months: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(1);
  copy.setUTCMonth(copy.getUTCMonth() - months + 1);
  return copy;
}

export function getRegionSeries(item: Phase3ItemDataset, code: string): Phase3RegionSeries | null {
  return item.regionMap[code] ?? item.regionMap[item.defaultRegion] ?? null;
}

export function collectRegionOptions(items: Phase3ItemDataset[]): Array<{ code: string; name: string; type: string }> {
  const map = new Map<string, { code: string; name: string; type: string }>();
  items.forEach((item) => {
    item.regions.forEach((region) => {
      if (!map.has(region.code)) {
        map.set(region.code, { code: region.code, name: region.name, type: region.type });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
