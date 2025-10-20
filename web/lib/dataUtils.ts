/**
 * Utility functions for dataset manipulation and export.
 */

export interface CPIDataPoint {
  date: string;
  cpi_value: number;
  sector?: string;
}

export interface DatasetRecord {
  date: string;
  indexValue: number;
  yoyPercent: number | null;
  category: string;
  sector?: string;
  source: string;
}

/**
 * Format CPI value with 2 decimal places
 */
export function formatCPI(value: number): string {
  return typeof value === "number" ? value.toFixed(2) : "--";
}

/**
 * Format WPI value with 2 decimal places
 */
export function formatWPI(value: number): string {
  return typeof value === "number" ? value.toFixed(2) : "--";
}

/**
 * Format percentage with 2 decimal places and % sign
 */
export function formatPercent(value: number | null | undefined): string {
  if (!value || Number.isNaN(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format date from YYYY-MM to readable format
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr + "-01");
    return date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  } catch {
    return dateStr;
  }
}

/**
 * Calculate year-over-year inflation rate
 */
export function calculateYoY(currentValue: number, previousYearValue: number): number {
  if (!previousYearValue || previousYearValue === 0) return 0;
  return ((currentValue - previousYearValue) / previousYearValue) * 100;
}

/**
 * Filter data by date range
 */
export function filterDataByRange(
  data: CPIDataPoint[],
  fromDate: string | null,
  toDate: string | null
): CPIDataPoint[] {
  if (!data || data.length === 0) return [];

  return data.filter((point) => {
    if (fromDate && point.date < fromDate) return false;
    if (toDate && point.date > toDate) return false;
    return true;
  });
}

/**
 * Filter data by sector
 */
export function filterDataBySector(data: CPIDataPoint[], sector: string | null): CPIDataPoint[] {
  if (!sector || sector === "All") return data;
  return data.filter((point) => point.sector === sector);
}

/**
 * Sort data by date (ascending or descending)
 */
export function sortByDate(data: CPIDataPoint[], direction: "asc" | "desc" = "asc"): CPIDataPoint[] {
  return [...data].sort((a, b) => {
    const comparison = a.date.localeCompare(b.date);
    return direction === "asc" ? comparison : -comparison;
  });
}

/**
 * Convert CPI data to CSV format
 */
export function exportToCSV(data: DatasetRecord[], filename: string = "cpi-data.csv"): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  // Define headers
  const headers = ["Date", "Index Value", "YoY Change (%)", "Category", "Sector", "Source"];

  // Convert data to CSV rows
  const rows = data.map((record) => [
    formatDate(record.date),
    formatCPI(record.indexValue),
    formatPercent(record.yoyPercent),
    record.category,
    record.sector || "Combined",
    record.source,
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename);
}

/**
 * Convert data to JSON format
 */
export function exportToJSON(data: DatasetRecord[], filename: string = "cpi-data.json"): void {
  if (!data || data.length === 0) {
    console.warn("No data to export");
    return;
  }

  const jsonData = {
    metadata: {
      exportDate: new Date().toISOString(),
      recordCount: data.length,
      source: "IndiaInflation.com - MoSPI & DPIIT Data",
    },
    data: data.map((record) => ({
      date: record.date,
      dateFormatted: formatDate(record.date),
      indexValue: parseFloat(formatCPI(record.indexValue)),
      yoyPercentage: record.yoyPercent ? parseFloat(formatPercent(record.yoyPercent)) : null,
      category: record.category,
      sector: record.sector || "Combined",
      source: record.source,
    })),
  };

  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  downloadBlob(blob, filename);
}

/**
 * Helper function to trigger blob download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Format large numbers with commas
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/**
 * Get sector display label
 */
export function getSectorLabel(sector: string | null | undefined): string {
  const sectorMap: Record<string, string> = {
    Combined: "All-India Combined",
    Urban: "Urban Areas",
    Rural: "Rural Areas",
  };
  return sectorMap[sector || "Combined"] || sector || "Combined";
}

/**
 * Get category display label
 */
export function getCategoryLabel(category: string): string {
  const categoryMap: Record<string, string> = {
    "All Items": "All Items (Headline)",
    "Food & Beverages": "Food & Beverages",
    "Fuel & Light": "Fuel & Light",
    Housing: "Housing",
    Clothing: "Clothing, Footwear & Bedding",
    Health: "Health",
    Education: "Education",
    Recreation: "Recreation & Culture",
    Communication: "Communication",
    Other: "Other Goods & Services",
  };
  return categoryMap[category] || category;
}

/**
 * Parse date range string (e.g., "2000-2024") to from/to dates
 */
export function parseDateRange(rangeStr: string | null): { from: string | null; to: string | null } {
  if (!rangeStr) return { from: null, to: null };

  const parts = rangeStr.split("-").map((p) => p.trim());
  if (parts.length === 2) {
    return {
      from: `${parts[0]}-01`,
      to: `${parts[1]}-12`,
    };
  }

  return { from: null, to: null };
}

/**
 * Generate date range options for filter dropdown
 */
export function getDateRangeOptions(): Array<{ value: string; label: string }> {
  const currentYear = new Date().getFullYear();
  return [
    { value: "", label: "All Years" },
    { value: "1958-1970", label: "1958-1970" },
    { value: "1971-1980", label: "1971-1980" },
    { value: "1981-1990", label: "1981-1990" },
    { value: "1991-2000", label: "1991-2000" },
    { value: "2001-2010", label: "2001-2010" },
    { value: "2011-2020", label: "2011-2020" },
    { value: `2021-${currentYear}`, label: `2021-${currentYear} (Recent)` },
    { value: `${currentYear - 5}-${currentYear}`, label: "Last 5 Years" },
  ];
}

/**
 * Check if data point is recent (within last 6 months)
 */
export function isRecent(dateStr: string): boolean {
  const date = new Date(dateStr + "-01");
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  return date >= sixMonthsAgo && date <= now;
}
