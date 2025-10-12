import type { NextApiRequest, NextApiResponse } from "next";

import {
  ExportNotFoundError,
  ExportTooLargeError,
  convertExportToCsv,
  loadItemExport
} from "@/lib/exportLoader";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
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
    const csv = await convertExportToCsv(data);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${slug}.csv"`);
    res.status(200).send(csv);
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
