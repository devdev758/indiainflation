import type { NextApiRequest, NextApiResponse } from "next";

import {
  ExportNotFoundError,
  ExportTooLargeError,
  getGzipStreamForDownload
} from "@/lib/exportLoader";

export const config = {
  api: {
    responseLimit: false
  }
};

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
    const { stream, contentLength, filename } = await getGzipStreamForDownload(slug);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength.toString());
    }
    res.setHeader("Content-Type", "application/gzip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200);
    stream.on("error", () => {
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    });
    stream.pipe(res);
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
