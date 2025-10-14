'use client';

import { useEffect, useState } from "react";

import type { ItemExportData } from "@/lib/exportLoader";

type State = {
  data: Record<string, ItemExportData | null>;
  loading: boolean;
  error: string | null;
};

const cache = new Map<string, ItemExportData>();

async function loadExport(slug: string): Promise<ItemExportData> {
  const response = await fetch(`/api/exports/items/${slug}`);
  if (!response.ok) {
    throw new Error(`Failed to load export for ${slug}`);
  }
  return (await response.json()) as ItemExportData;
}

export function useItemExports(slugs: string[]): State {
  const [state, setState] = useState<State>({ data: {}, loading: slugs.length > 0, error: null });

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const uniqueSlugs = Array.from(new Set(slugs.filter(Boolean)));

      if (!uniqueSlugs.length) {
        setState({ data: {}, loading: false, error: null });
        return;
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const entries = await Promise.all(
          uniqueSlugs.map(async (slug) => {
            if (cache.has(slug)) {
              return [slug, cache.get(slug)!] as const;
            }
            const exportData = await loadExport(slug);
            cache.set(slug, exportData);
            return [slug, exportData] as const;
          })
        );

        if (!cancelled) {
          setState({
            data: Object.fromEntries(entries),
            loading: false,
            error: null
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({ data: {}, loading: false, error: error instanceof Error ? error.message : "Failed to load data" });
        }
      }
    }

    fetchAll();

    return () => {
      cancelled = true;
    };
  }, [slugs]);

  return state;
}
