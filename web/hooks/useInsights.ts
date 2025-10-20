import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/components/apiClient";

export interface InsightArticle {
  id: number | string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featured_media_url?: string;
  author?: {
    name: string;
    url?: string;
  };
  categories?: string[];
  tags?: string[];
  date: string;
  modified?: string;
}

export interface InsightsListResponse {
  articles: InsightArticle[];
  total: number;
  pages: number;
}

/**
 * Fetch insights/articles listing with pagination and filters
 */
export function useInsightsList(
  page: number = 1,
  category?: string,
  search?: string
) {
  return useQuery({
    queryKey: ["insights", "list", page, category, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("per_page", "10");
      if (category) params.append("category", category);
      if (search) params.append("search", search);

      try {
        // Try WordPress API first
        const response = await apiClient.get<InsightsListResponse>(
          `/wp-json/wp/v2/posts?${params.toString()}`
        );
        return response.data;
      } catch (error) {
        // Fallback to static insights endpoint
        const response = await apiClient.get<InsightsListResponse>(
          `/insights?${params.toString()}`
        );
        return response.data;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

/**
 * Fetch single insight article by slug
 */
export function useInsight(slug: string) {
  return useQuery({
    queryKey: ["insights", slug],
    queryFn: async () => {
      try {
        // Try WordPress API first
        const response = await apiClient.get<InsightArticle>(
          `/wp-json/wp/v2/posts?slug=${slug}`
        );
        if (Array.isArray(response.data) && response.data.length > 0) {
          return response.data[0];
        }
      } catch (error) {
        // Fallback to insights endpoint
      }

      // Fallback to static endpoint
      const response = await apiClient.get<InsightArticle>(
        `/insights/${slug}`
      );
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,
    enabled: !!slug,
  });
}

/**
 * Fetch insights filtered by category
 */
export function useInsightsByCategory(
  category: string,
  page: number = 1
) {
  return useQuery({
    queryKey: ["insights", "category", category, page],
    queryFn: async () => {
      return useInsightsList(page, category).data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    enabled: !!category,
  });
}

/**
 * Fetch all available categories/tags for filtering
 */
export function useInsightCategories() {
  return useQuery({
    queryKey: ["insights", "categories"],
    queryFn: async () => {
      try {
        const response = await apiClient.get<Array<{ id: number; name: string; slug: string }>>(
          "/wp-json/wp/v2/categories"
        );
        return response.data;
      } catch (error) {
        // Fallback
        return [];
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 60 * 60 * 1000,
  });
}
