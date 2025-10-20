import type { NextApiRequest, NextApiResponse } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function generateSitemapXml(entries: SitemapEntry[]): string {
  const baseUrl = SITE_URL.replace(/\/$/, "");
  const lastModDate = new Date().toISOString().split("T")[0];

  const xmlEntries = entries
    .map(
      (entry) => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod || lastModDate}</lastmod>
    <changefreq>${entry.changefreq || "weekly"}</changefreq>
    <priority>${entry.priority !== undefined ? entry.priority : 0.8}</priority>
  </url>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<string>) {
  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  const baseUrl = SITE_URL.replace(/\/$/, "");
  const lastModDate = new Date().toISOString().split("T")[0];

  const sitemapEntries: SitemapEntry[] = [
    {
      url: baseUrl,
      lastmod: lastModDate,
      changefreq: "daily",
      priority: 1.0
    },
    {
      url: `${baseUrl}/cpi-dashboard`,
      lastmod: lastModDate,
      changefreq: "daily",
      priority: 0.9
    },
    {
      url: `${baseUrl}/compare`,
      lastmod: lastModDate,
      changefreq: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/about`,
      lastmod: lastModDate,
      changefreq: "monthly",
      priority: 0.7
    },
    {
      url: `${baseUrl}/datasets`,
      lastmod: lastModDate,
      changefreq: "weekly",
      priority: 0.8
    },
    {
      url: `${baseUrl}/contact`,
      lastmod: lastModDate,
      changefreq: "yearly",
      priority: 0.6
    },
    {
      url: `${baseUrl}/privacy`,
      lastmod: lastModDate,
      changefreq: "yearly",
      priority: 0.5
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastmod: lastModDate,
      changefreq: "yearly",
      priority: 0.5
    }
  ];

  const sitemapXml = generateSitemapXml(sitemapEntries);

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
  res.status(200).send(sitemapXml);
}
