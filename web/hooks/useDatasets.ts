import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/components/apiClient";
import type { CPIDataPoint } from "@/lib/dataUtils";

export interface DatasetFilters {
  type: "cpi" | "wpi";
  sector?: "Combined" | "Urban" | "Rural";
  fromDate?: string;
  toDate?: string;
}

interface HistoricalResponse {
  data: CPIDataPoint[];
  coverage: {
    from: string;
    to: string;
    total_points: number;
  };
  source: string;
  cached: boolean;
}

/**
 * Fetch historical CPI data with optional filters
 */
export function useHistoricalCPI(
  filters?: Omit<DatasetFilters, "type">
) {
  return useQuery({
    queryKey: ["datasets", "cpi", filters?.sector, filters?.fromDate, filters?.toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fromDate) params.append("from_date", filters.fromDate);
      if (filters?.toDate) params.append("to_date", filters.toDate);

      const response = await apiClient.get<HistoricalResponse>(
        `/inflation/historical?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Fetch historical WPI data with optional filters
 */
export function useHistoricalWPI(
  filters?: Omit<DatasetFilters, "type">
) {
  return useQuery({
    queryKey: ["datasets", "wpi", filters?.fromDate, filters?.toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.fromDate) params.append("from_date", filters.fromDate);
      if (filters?.toDate) params.append("to_date", filters.toDate);

      const response = await apiClient.get<HistoricalResponse>(
        `/inflation/historical?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch dataset based on type and filters
 */
export function useDataset(filters: DatasetFilters) {
  return filters.type === "cpi"
    ? useHistoricalCPI(filters)
    : useHistoricalWPI(filters);
}

/**
 * Fetch metadata about datasets
 */
export function useDatasetMetadata() {
  return useQuery({
    queryKey: ["datasets", "metadata"],
    queryFn: async () => {
      const response = await apiClient.get("/inflation/historical/metadata");
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 60 * 60 * 1000,
  });
}
