import type { NextApiRequest, NextApiResponse } from "next";

import { DATASET_DEFINITIONS } from "@/lib/data/catalog";
import { loadItemExport } from "@/lib/exportLoader";

type DatasetResponse = {
  slug: string;
  title: string;
  source: string;
  description: string;
  observations: number;
  latestMonth: string | null;
  regions: number;
};

type SuccessResponse = {
  datasets: DatasetResponse[];
  generatedAt: string;
};

type ErrorResponse = {
  error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<SuccessResponse | ErrorResponse>): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  try {
    const datasets: DatasetResponse[] = [];

    for (const definition of DATASET_DEFINITIONS) {
      try {
        const { data } = await loadItemExport(definition.slug, true);
        const observations = data.metadata?.count ?? data.series.length;
        const latestMonth = data.metadata?.last_date ?? data.series.at(-1)?.date ?? null;
        const regions = Array.isArray(data.regions) ? data.regions.length : 0;

        datasets.push({
          slug: data.slug,
          title: definition.title,
          source: definition.source,
          description: definition.description,
          observations,
          latestMonth,
          regions,
        });
      } catch (error) {
        datasets.push({
          slug: definition.slug,
          title: definition.title,
          source: definition.source,
          description: definition.description,
          observations: 0,
          latestMonth: null,
          regions: 0,
        });
      }
    }

    res.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=600");
    res.status(200).json({ datasets, generatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: "internal_error" });
  }
}
