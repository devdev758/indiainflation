import type { NextApiRequest, NextApiResponse } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";

export default function handler(req: NextApiRequest, res: NextApiResponse<string>) {
  if (req.method !== "GET") {
    res.status(405).end("Method Not Allowed");
    return;
  }

  const baseUrl = SITE_URL.replace(/\/$/, "");

  const robotsTxt = `# Indiainflation Robots Configuration
# Last updated: ${new Date().toISOString()}

# Allow all crawlers
User-agent: *
Allow: /

# Specific rules for search engines
User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Disallow private/admin paths (if any)
Disallow: /admin/
Disallow: /api/
Disallow: /internal/
Disallow: /.env
Disallow: /.env.*

# Sitemap reference
Sitemap: ${baseUrl}/sitemap.xml

# Cache policy
Cache-control: public, max-age=604800`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=604800, stale-while-revalidate=2592000");
  res.status(200).send(robotsTxt);
}
