/**
 * Utility functions for state-wise inflation map
 */

export interface StatewiseData {
  state: string;
  cpi_value: number;
  yoy_percent: number;
  category?: string;
}

/**
 * Color scale for YoY inflation %
 * Uses green (low inflation) to red (high inflation)
 */
export function getInflationColor(yoyPercent: number): string {
  // Define thresholds and colors
  if (yoyPercent < 0) return "#10B981"; // Green - deflation
  if (yoyPercent < 2) return "#6EE7B7"; // Light green - very low
  if (yoyPercent < 4) return "#FBBF24"; // Yellow - moderate
  if (yoyPercent < 6) return "#F97316"; // Orange - elevated
  if (yoyPercent < 8) return "#EF4444"; // Red - high
  return "#DC2626"; // Dark red - very high
}

/**
 * Get color scale boundaries for legend
 */
export function getColorScaleBoundaries(): Array<{
  min: number;
  max: number;
  color: string;
  label: string;
}> {
  return [
    { min: -Infinity, max: 0, color: "#10B981", label: "Deflation" },
    { min: 0, max: 2, color: "#6EE7B7", label: "Very Low (0-2%)" },
    { min: 2, max: 4, color: "#FBBF24", label: "Moderate (2-4%)" },
    { min: 4, max: 6, color: "#F97316", label: "Elevated (4-6%)" },
    { min: 6, max: 8, color: "#EF4444", label: "High (6-8%)" },
    { min: 8, max: Infinity, color: "#DC2626", label: "Very High (>8%)" },
  ];
}

/**
 * Normalize state names for matching with GeoJSON
 */
export function normalizeStateName(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "");
}

/**
 * Calculate statistics from state-wise data
 */
export interface StatewiseStats {
  highest: StatewiseData;
  lowest: StatewiseData;
  average: number;
  median: number;
  min: number;
  max: number;
}

export function calculateStatewiseStats(data: StatewiseData[]): StatewiseStats {
  if (data.length === 0) {
    throw new Error("No data provided");
  }

  const sorted = [...data].sort((a, b) => a.yoy_percent - b.yoy_percent);

  const average = data.reduce((sum, d) => sum + d.yoy_percent, 0) / data.length;
  const median = sorted[Math.floor(sorted.length / 2)].yoy_percent;

  return {
    highest: [...data].sort((a, b) => b.yoy_percent - a.yoy_percent)[0],
    lowest: sorted[0],
    average,
    median,
    min: sorted[0].yoy_percent,
    max: sorted[sorted.length - 1].yoy_percent,
  };
}

/**
 * Format number for display
 */
export function formatInflationValue(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

/**
 * Export state data as CSV
 */
export function exportStateDataAsCSV(
  data: StatewiseData[],
  monthYear: string,
  sector: string
): void {
  const headers = ["State", "CPI Value", "YoY Inflation %", "Category"];
  const rows = data.map((d) => [
    d.state,
    d.cpi_value.toFixed(2),
    d.yoy_percent.toFixed(2),
    d.category || sector,
  ]);

  // Add metadata rows
  const metaRows = [
    [],
    ["Metadata"],
    ["Month/Year", monthYear],
    ["Sector", sector],
    ["Total States", data.length.toString()],
    ["Average YoY %", (data.reduce((sum, d) => sum + d.yoy_percent, 0) / data.length).toFixed(2)],
  ];

  const csv = [headers, ...rows, ...metaRows].map((row) => row.join(",")).join("\n");

  const link = document.createElement("a");
  link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  link.download = `statewise-inflation-${monthYear.replace(/\//g, "-")}-${sector}.csv`;
  link.click();
}

/**
 * Export map as PNG using html2canvas
 */
export async function exportMapAsPNG(mapRef: HTMLElement, monthYear: string): Promise<void> {
  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(mapRef, {
      backgroundColor: "#FFFFFF",
      scale: 2,
      logging: false,
    });

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `india-statewise-inflation-${monthYear.replace(/\//g, "-")}.png`;
    link.click();
  } catch (err) {
    console.error("Export failed:", err);
    throw new Error("Failed to export map. Ensure html2canvas is installed.");
  }
}

/**
 * Get tooltip content for state
 */
export function getStateTooltip(state: StatewiseData): string {
  return `${state.state}\nCPI: ${state.cpi_value.toFixed(2)}\nYoY: ${state.yoy_percent.toFixed(2)}%`;
}

/**
 * Filter states by inflation range
 */
export function filterByInflationRange(
  data: StatewiseData[],
  min: number,
  max: number
): StatewiseData[] {
  return data.filter((d) => d.yoy_percent >= min && d.yoy_percent <= max);
}

/**
 * Sort states by YoY inflation
 */
export function sortByInflation(
  data: StatewiseData[],
  order: "asc" | "desc" = "desc"
): StatewiseData[] {
  const sorted = [...data];
  return sorted.sort((a, b) =>
    order === "desc" ? b.yoy_percent - a.yoy_percent : a.yoy_percent - b.yoy_percent
  );
}

/**
 * Get region-wise grouping (North, South, East, West, North-East, Central)
 */
const stateRegions: Record<string, string> = {
  "Jammu and Kashmir": "North",
  Himachal Pradesh: "North",
  Punjab: "North",
  Haryana: "North",
  Delhi: "North",
  Uttarakhand: "North",
  "Uttar Pradesh": "North",
  Rajasthan: "North",
  "Madhya Pradesh": "Central",
  Chhattisgarh: "Central",
  Odisha: "East",
  "West Bengal": "East",
  Bihar: "East",
  Jharkhand: "East",
  Assam: "Northeast",
  Meghalaya: "Northeast",
  Tripura: "Northeast",
  Manipur: "Northeast",
  Mizoram: "Northeast",
  Nagaland: "Northeast",
  "Arunachal Pradesh": "Northeast",
  Sikkim: "Northeast",
  Gujarat: "West",
  Maharashtra: "West",
  Goa: "West",
  "Andhra Pradesh": "South",
  Telangana: "South",
  Karnataka: "South",
  "Tamil Nadu": "South",
  Kerala: "South",
};

export function getStateRegion(state: string): string {
  return stateRegions[state] || "Other";
}

export function groupByRegion(data: StatewiseData[]): Record<string, StatewiseData[]> {
  const grouped: Record<string, StatewiseData[]> = {};

  data.forEach((item) => {
    const region = getStateRegion(item.state);
    if (!grouped[region]) {
      grouped[region] = [];
    }
    grouped[region].push(item);
  });

  return grouped;
}
