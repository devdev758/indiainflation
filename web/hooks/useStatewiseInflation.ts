import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/components/apiClient";

export interface StatewiseInflationPoint {
  state: string;
  cpi_value: number;
  yoy_percent: number;
  month: string;
  category?: string;
}

export interface StatewiseInflationResponse {
  data: StatewiseInflationPoint[];
  metadata: {
    month: string;
    sector: string;
    states_count: number;
    base_year?: string;
  };
}

/**
 * Fetch state-wise inflation data
 * @param month - Month in YYYY-MM format
 * @param sector - 'Combined', 'Urban', or 'Rural'
 */
export function useStatewiseInflation(
  month: string = new Date().toISOString().split("T")[0].slice(0, 7),
  sector: "Combined" | "Urban" | "Rural" = "Combined"
) {
  return useQuery({
    queryKey: ["statewise-inflation", month, sector],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("month", month);
      params.append("sector", sector);

      const response = await apiClient.get<StatewiseInflationResponse>(
        `/api/inflation/statewise?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Fetch all available months for state-wise data
 */
export function useStatewiseMonths() {
  return useQuery({
    queryKey: ["statewise-months"],
    queryFn: async () => {
      const response = await apiClient.get<{
        months: string[];
        latest: string;
      }>("/api/inflation/statewise/months");
      return response.data;
    },
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

/**
 * Fetch state-wise inflation comparison (multiple months)
 */
export function useStatewiseComparison(
  months: string[],
  sector: "Combined" | "Urban" | "Rural" = "Combined"
) {
  const queries = months.map((month) => useStatewiseInflation(month, sector));

  return {
    data: queries.map((q) => q.data),
    isLoading: queries.some((q) => q.isLoading),
    error: queries.find((q) => q.error)?.error,
  };
}

/**
 * Fetch state-wise trends (single state, multiple months)
 */
export function useStateTrend(
  state: string,
  months: string[],
  sector: "Combined" | "Urban" | "Rural" = "Combined"
) {
  return useQuery({
    queryKey: ["state-trend", state, months, sector],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("state", state);
      params.append("sector", sector);
      months.forEach((m) => params.append("months", m));

      const response = await apiClient.get<{
        state: string;
        data: Array<{
          month: string;
          cpi_value: number;
          yoy_percent: number;
        }>;
      }>(`/api/inflation/statewise/trend?${params.toString()}`);
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
  });
}

/**
 * Get formatted month display label
 */
export function formatMonthLabel(monthStr: string): string {
  try {
    const [year, month] = monthStr.split("-");
    const date = new Date(Number(year), Number(month) - 1);
    return date.toLocaleDateString("en-IN", { year: "numeric", month: "short" });
  } catch {
    return monthStr;
  }
}

/**
 * Get previous month in YYYY-MM format
 */
export function getPreviousMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  date.setMonth(date.getMonth() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Get month range for past N months
 */
export function getMonthRange(months: number, endMonth?: string): string[] {
  const endDate = endMonth ? new Date(endMonth + "-01") : new Date();
  const range: string[] = [];

  for (let i = 0; i < months; i++) {
    const date = new Date(endDate);
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    range.push(`${year}-${month}`);
  }

  return range.reverse();
}
