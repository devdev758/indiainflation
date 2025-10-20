import fs from "node:fs/promises";
import path from "node:path";

const ROUTES = ["/", "/cpi-dashboard", "/compare", "/datasets", "/calculators", "/inflation-history", "/articles"];

function normaliseBase(base: string): string {
  if (!base) return "https://indiainflation.com";
  return base.replace(/\/$/, "");
}

async function main(): Promise<void> {
  const base = normaliseBase(process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com");
  const now = new Date().toISOString();

  const urls = ROUTES.map((route) => {
    const loc = `${base}${route}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n  </url>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  const repoRoot = path.resolve(process.cwd(), "..");
  const publicDir = path.join(repoRoot, "public");
  const reportsDir = path.join(repoRoot, "reports");
  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(reportsDir, { recursive: true });

  await fs.writeFile(path.join(publicDir, "sitemap.xml"), xml, "utf-8");
  await fs.writeFile(path.join(reportsDir, "phase4-sitemap.xml"), xml, "utf-8");
  console.log(`Generated sitemap for ${base}`);
}

main().catch((error) => {
  console.error("Failed to generate sitemap", error);
  process.exitCode = 1;
});
