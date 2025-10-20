#!/usr/bin/env ts-node
import fs from "fs";
import path from "path";

const CHECKS = {
  passed: [] as string[],
  warnings: [] as string[],
  failed: [] as string[]
};

function check(condition: boolean, message: string, type: "pass" | "warn" | "fail" = "pass") {
  if (condition) {
    CHECKS[type === "pass" ? "passed" : type].push(message);
  }
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

function getFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return "";
  }
}

async function validateSEO() {
  console.log("\n📊 Indiainflation SEO & Analytics Validation\n");
  console.log("=" + "=".repeat(59));

  // 1. Check environment variables
  console.log("\n✓ Environment Variables:");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://indiainflation.com";
  check(!!siteUrl, `  • NEXT_PUBLIC_SITE_URL configured: ${siteUrl}`);

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  check(!!gaId, `  • GA4 ID configured: ${gaId || "NOT SET"}`);
  if (!gaId) {
    CHECKS.warnings.push("    ⚠️  GA4 measurement ID is missing. Analytics will not track.");
  }

  // 2. Check required SEO files
  console.log("\n✓ Required Files:");
  const requiredFiles = [
    "pages/_document.tsx",
    "lib/seoConfig.ts",
    "lib/structuredData.ts",
    "pages/sitemap.xml.ts",
    "pages/robots.txt.ts"
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(process.cwd(), file);
    const exists = fileExists(filePath);
    check(exists, `  • ${file}: ${exists ? "✓" : "✗"}`);
    if (!exists) {
      CHECKS.failed.push(`Missing required file: ${file}`);
    }
  }

  // 3. Check _app.tsx for QueryClientProvider
  console.log("\n✓ React Query Setup:");
  const appPath = path.join(process.cwd(), "pages/_app.tsx");
  if (fileExists(appPath)) {
    const appContent = getFileContent(appPath);
    const hasQueryProvider = appContent.includes("QueryClientProvider");
    check(hasQueryProvider, `  • QueryClientProvider: ${hasQueryProvider ? "✓" : "✗"}`);

    const hasGA4Warning = appContent.includes("GA4_MEASUREMENT_ID");
    check(hasGA4Warning, `  • GA4 Warning Check: ${hasGA4Warning ? "✓" : "✗"}`);
  }

  // 4. Check page metadata
  console.log("\n✓ Page Metadata:");
  const pagesToCheck = [
    { file: "pages/index.tsx", name: "Home" },
    { file: "pages/cpi-dashboard.tsx", name: "CPI Dashboard" },
    { file: "pages/compare.tsx", name: "Compare" },
    { file: "pages/about.tsx", name: "About" }
  ];

  for (const page of pagesToCheck) {
    const pagePath = path.join(process.cwd(), page.file);
    if (fileExists(pagePath)) {
      const content = getFileContent(pagePath);
      const hasHead = content.includes("<Head>");
      const hasMeta = content.includes("meta");
      const hasCanonical = content.includes("canonical");
      check(hasHead && hasMeta && hasCanonical, `  • ${page.name}: ${hasHead && hasMeta && hasCanonical ? "✓" : "✗"}`);
    }
  }

  // 5. Check axios in dependencies
  console.log("\n✓ Dependencies:");
  const packagePath = path.join(process.cwd(), "package.json");
  if (fileExists(packagePath)) {
    const packageJson = JSON.parse(getFileContent(packagePath));
    const hasAxios = !!packageJson.dependencies?.axios;
    check(hasAxios, `  • axios installed: ${hasAxios ? "✓" : "✗"}`);

    const hasReactQuery = !!packageJson.dependencies?.["@tanstack/react-query"];
    check(hasReactQuery, `  • React Query installed: ${hasReactQuery ? "✓" : "✗"}`);

    const hasRecharts = !!packageJson.dependencies?.recharts;
    check(hasRecharts, `  • Recharts installed: ${hasRecharts ? "✓" : "✗"}`);
  }

  // 6. Check Next.js config
  console.log("\n✓ Next.js Configuration:");
  const nextConfigPath = path.join(process.cwd(), "next.config.js");
  const nextConfigExists = fileExists(nextConfigPath);
  check(nextConfigExists, `  • next.config.js exists: ${nextConfigExists ? "✓" : "✗"}`);

  // 7. Check tsconfig
  console.log("\n✓ TypeScript Configuration:");
  const tsconfigPath = path.join(process.cwd(), "tsconfig.json");
  const tsconfigExists = fileExists(tsconfigPath);
  check(tsconfigExists, `  • tsconfig.json exists: ${tsconfigExists ? "✓" : "✗"}`);

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("\n📋 Summary:\n");
  console.log(`✅ Passed: ${CHECKS.passed.length}`);
  CHECKS.passed.forEach((msg) => console.log(`   ${msg}`));

  if (CHECKS.warnings.length > 0) {
    console.log(`\n⚠️  Warnings: ${CHECKS.warnings.length}`);
    CHECKS.warnings.forEach((msg) => console.log(`   ${msg}`));
  }

  if (CHECKS.failed.length > 0) {
    console.log(`\n❌ Failed: ${CHECKS.failed.length}`);
    CHECKS.failed.forEach((msg) => console.log(`   ${msg}`));
  }

  // Recommendations
  if (CHECKS.failed.length > 0 || CHECKS.warnings.length > 0) {
    console.log("\n💡 Recommendations:");
    if (!gaId) {
      console.log("   • Set NEXT_PUBLIC_GA_MEASUREMENT_ID environment variable for analytics tracking");
    }
    console.log("   • Verify all pages have proper Head sections with meta tags");
    console.log("   • Ensure canonical URLs are set on each page");
    console.log("   • Test robots.txt at: /robots.txt");
    console.log("   • Test sitemap at: /sitemap.xml");
    console.log("   • Run next build to check for any TypeScript errors");
  }

  console.log("\n" + "=".repeat(60) + "\n");

  const exitCode = CHECKS.failed.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

validateSEO().catch((error) => {
  console.error("Validation error:", error);
  process.exit(1);
});
