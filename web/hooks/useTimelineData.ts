import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/components/apiClient";

export interface TimelineDataPoint {
  date: string;
  month: number;
  year: number;
  value: number;
  yoy_percent?: number;
  sector?: string;
}

export interface TimelineDataResponse {
  data: TimelineDataPoint[];
  metadata: {
    base_year?: string;
    start_date: string;
    end_date: string;
    data_type: string;
    sector: string;
    count: number;
  };
}

export interface TimelineFilters {
  dataType?: "cpi" | "wpi";
  sector?: "combined" | "urban" | "rural";
  fromDate?: string;
  toDate?: string;
  normalize?: boolean;
}

/**
 * Fetch timeline data from API with filtering options
 * Suitable for 1958-present historical analysis
 */
export function useTimelineData(filters: TimelineFilters = {}) {
  const {
    dataType = "cpi",
    sector = "combined",
    fromDate = "1958-01-01",
    toDate = new Date().toISOString().split("T")[0],
    normalize = false,
  } = filters;

  return useQuery({
    queryKey: ["timeline", dataType, sector, fromDate, toDate, normalize],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("from_date", fromDate);
      params.append("to_date", toDate);
      params.append("sector", sector);
      if (normalize) params.append("normalize", "true");

      const endpoint =
        dataType === "wpi"
          ? `/api/inflation/historical?type=wpi&${params.toString()}`
          : `/api/inflation/historical?${params.toString()}`;

      const response = await apiClient.get<TimelineDataResponse>(endpoint);
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Fetch multiple datasets simultaneously (CPI + WPI) for comparison
 */
export function useTimelineComparison(
  filters: Omit<TimelineFilters, "dataType"> = {}
) {
  const cpiQuery = useTimelineData({ ...filters, dataType: "cpi" });
  const wpiQuery = useTimelineData({ ...filters, dataType: "wpi" });

  return {
    cpi: cpiQuery.data,
    wpi: wpiQuery.data,
    isLoading: cpiQuery.isLoading || wpiQuery.isLoading,
    error: cpiQuery.error || wpiQuery.error,
  };
}

/**
 * Fetch specific year data for anniversary/milestone queries
 */
export function useTimelineYear(year: number, sector: string = "combined") {
  const fromDate = `${year}-01-01`;
  const toDate = `${year}-12-31`;

  return useTimelineData({
    dataType: "cpi",
    sector: sector as any,
    fromDate,
    toDate,
  });
}

/**
 * Fetch decade-level statistics (e.g., 1990s, 2000s, 2010s)
 */
export function useTimelineDecade(decade: number, sector: string = "combined") {
  const startYear = decade;
  const endYear = decade + 9;

  return useTimelineData({
    dataType: "cpi",
    sector: sector as any,
    fromDate: `${startYear}-01-01`,
    toDate: `${endYear}-12-31`,
  });
}

/**
 * Normalize data to a base year (100 = base year)
 */
export function normalizeData(
  data: TimelineDataPoint[],
  baseIndex: number = 100
): TimelineDataPoint[] {
  if (data.length === 0) return data;

  const firstValue = data[0].value;
  return data.map((point) => ({
    ...point,
    value: (point.value / firstValue) * baseIndex,
  }));
}

/**
 * Calculate average CPI for a period
 */
export function calculateAverageValue(data: TimelineDataPoint[]): number {
  if (data.length === 0) return 0;
  return data.reduce((sum, point) => sum + point.value, 0) / data.length;
}

/**
 * Get min/max values for scaling
 */
export function getValueRange(
  data: TimelineDataPoint[]
): { min: number; max: number } {
  if (data.length === 0) return { min: 0, max: 100 };

  const values = data.map((p) => p.value);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}
