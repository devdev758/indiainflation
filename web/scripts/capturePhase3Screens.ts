import fs from "node:fs/promises";
import path from "node:path";

import puppeteer from "puppeteer";

const STAGING_BASE = process.env.STAGING_BASE ?? "http://188.245.150.69";
const OUTPUT_DIR = path.join(process.cwd(), "web", "screenshots", "phase3");

const targets: Array<{ route: string; name: string }> = [
  { route: "/", name: "homepage" },
  { route: "/cpi-dashboard", name: "cpi-dashboard" },
  { route: "/compare", name: "compare" },
  { route: "/datasets", name: "datasets" },
  { route: "/inflation-history", name: "inflation-history" }
];

async function ensureOutputDir(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function capture(): Promise<void> {
  await ensureOutputDir();
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security",
      "--disable-features=IsolateOrigins,site-per-process,BlockInsecurePrivateNetworkRequests",
      "--disable-site-isolation-trials",
      "--disable-dev-shm-usage"
    ]
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.25 });
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ Host: "indiainflation.in" });

  for (const target of targets) {
    const url = new URL(target.route, STAGING_BASE).toString();
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const filePath = path.join(OUTPUT_DIR, `${target.name}.png`) as `${string}.png`;
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Captured ${filePath}`);
    } catch (error) {
      console.error(`Failed to capture ${url}`, error);
    }
  }

  await browser.close();
}

capture().catch((error) => {
  console.error("Screenshot capture failed", error);
  process.exitCode = 1;
});
