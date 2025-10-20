import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/components/apiClient";

type ApiResponse<T> = { data: T };

export type LatestInflation = {
  dataset: string;
  observation_month: string;
  sector?: string | null;
  major_group?: string | null;
  subgroup?: string | null;
  category?: string | null;
  index_value: number;
  yoy_inflation_rate?: number | null;
};

export type TrendEntry = {
  dataset: string;
  observation_month: string;
  sector: string | null;
  label: string | null;
  index_value: number;
};

export type ComparisonEntry = {
  dataset: string;
  observation_month: string;
  index_value: number;
  yoy_inflation_rate: number | null;
};

export type GroupEntry = {
  major_group: string;
  index_value: number;
  yoy_inflation_rate: number | null;
};

export type StatewiseEntry = {
  state: string;
  sector: string;
  observation_month: string;
  index_value: number;
  inflation_rate: number | null;
  major_group: string | null;
  subgroup: string | null;
};

export function useLatestInflation() {
  return useQuery({
    queryKey: ["inflation", "latest"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<LatestInflation[]>>("/inflation/latest");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000
  });
}

export function useTrends(limit = 24) {
  return useQuery({
    queryKey: ["inflation", "trends", limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<TrendEntry[]>>("/inflation/trends", {
        params: { limit }
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000
  });
}

export function useCompare(sector: string, cpiGroup: string, wpiCategory: string, months: number) {
  return useQuery({
    queryKey: ["inflation", "compare", sector, cpiGroup, wpiCategory, months],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ComparisonEntry[]>>("/inflation/compare", {
        params: { sector, cpi_group: cpiGroup, wpi_category: wpiCategory, months }
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(sector && cpiGroup && wpiCategory && months)
  });
}

export function useGroups(sector: string) {
  return useQuery({
    queryKey: ["inflation", "groups", sector],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<GroupEntry[]>>("/inflation/groups", {
        params: { sector }
      });
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000
  });
}

export function useStatewise() {
  return useQuery({
    queryKey: ["inflation", "statewise"],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<StatewiseEntry[]>>("/inflation/statewise");
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000
  });
}
