import fs from "node:fs/promises";
import path from "node:path";

import puppeteer from "puppeteer";

type Target = {
  route: string;
  name: string;
};

const DEFAULT_BASE = process.env.STAGING_BASE ?? "http://188.245.150.69";
const REPO_ROOT = path.resolve(process.cwd(), "..");
const OUTPUT_DIR = path.join(REPO_ROOT, "reports", "screenshots", "phase4");

const TARGETS: Target[] = [
  { route: "/", name: "home" },
  { route: "/cpi-dashboard", name: "cpi-dashboard" },
  { route: "/compare", name: "compare" },
  { route: "/datasets", name: "datasets" },
  { route: "/calculators", name: "calculators" },
  { route: "/inflation-history", name: "inflation-history" },
  { route: "/articles", name: "articles" }
];

async function captureScreenshots(): Promise<void> {
  const base = DEFAULT_BASE.replace(/\/$/, "");
  const hostOverride = process.env.STAGING_HOST;
  const hostMap = process.env.STAGING_HOST_MAP; // format: hostname:ip

  const launchArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process,BlockInsecurePrivateNetworkRequests",
    "--allow-running-insecure-content",
    "--disable-site-isolation-trials",
    "--disable-blink-features=AutomationControlled"
  ];

  if (hostMap) {
    launchArgs.push(`--host-resolver-rules=MAP ${hostMap},EXCLUDE localhost`);
  }

  const browser = await puppeteer.launch({ headless: true, args: launchArgs });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.25 });
  await page.setBypassCSP(true);
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
  );

  if (hostOverride) {
    await page.setExtraHTTPHeaders({ Host: hostOverride });
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const summary: Array<{ route: string; file?: string; error?: string }> = [];

  for (const target of TARGETS) {
    const url = `${base}${target.route}`;
    const filePath = path.join(OUTPUT_DIR, `${target.name}.png`);
    const typedPath = filePath as `${string}.png`;
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await page.screenshot({ path: typedPath, type: "png", fullPage: true });
      summary.push({ route: target.route, file: filePath });
      console.log(`Captured ${target.route} -> ${filePath}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      summary.push({ route: target.route, error: message });
      console.warn(`Failed to capture ${target.route}: ${message}`);
    }
  }

  await browser.close();

  await fs.writeFile(path.join(OUTPUT_DIR, "summary.json"), JSON.stringify({ base, generatedAt: new Date().toISOString(), summary }, null, 2));
}

captureScreenshots().catch((error) => {
  console.error("Failed to capture Phase 4 screenshots", error);
  process.exitCode = 1;
});
