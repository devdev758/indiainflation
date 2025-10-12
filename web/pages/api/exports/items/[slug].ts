import type { NextApiRequest, NextApiResponse } from "next";

import {
  ExportNotFoundError,
  ExportTooLargeError,
  ItemExportData,
  loadItemExport
} from "@/lib/exportLoader";

type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ItemExportData | ErrorResponse>
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const slugParam = req.query.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug) {
    res.status(400).json({ error: "missing_slug" });
    return;
  }

  try {
    const { data } = await loadItemExport(slug, true);
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=300");
    res.status(200).json(data);
  } catch (error) {
    if (error instanceof ExportNotFoundError) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    if (error instanceof ExportTooLargeError) {
      res.status(413).json({ error: "payload_too_large" });
      return;
    }

    res.status(500).json({ error: "internal_error" });
  }
}
