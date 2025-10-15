export type DatasetDefinition = {
  slug: string;
  title: string;
  description: string;
  source: string;
  color?: string;
  category: "cpi" | "wpi" | "imf";
};

export const DATASET_DEFINITIONS: DatasetDefinition[] = [
  {
    slug: "cpi-all-items",
    title: "CPI All Items",
    description: "Headline CPI index with national default, regional breakdowns, and derived YoY/MoM metrics.",
    source: "MOSPI CPI",
    color: "#2563eb",
    category: "cpi"
  },
  {
    slug: "cpi-food-and-beverages",
    title: "CPI Food & Beverages",
    description: "Food & Beverages CPI to monitor household essentials across rural, urban, and state cohorts.",
    source: "MOSPI CPI",
    color: "#10b981",
    category: "cpi"
  },
  {
    slug: "cpi-fuel-and-light",
    title: "CPI Fuel & Light",
    description: "Fuel & Light CPI series highlighting energy and utility inflation across India.",
    source: "MOSPI CPI",
    color: "#7c3aed",
    category: "cpi"
  },
  {
    slug: "wpi-all-commodities",
    title: "WPI All Commodities",
    description: "Wholesale Price Index (All Commodities) aligned with DPIIT disclosures for supply-chain analytics.",
    source: "DPIIT WPI",
    color: "#f97316",
    category: "wpi"
  },
  {
    slug: "imf-cpi-all-items",
    title: "IMF CPI All Items",
    description: "IMF CPI headline series enabling cross-country benchmarking for macro analysts.",
    source: "IMF API",
    color: "#6366f1",
    category: "imf"
  }
];

export const DATASET_LOOKUP = Object.fromEntries(DATASET_DEFINITIONS.map((entry) => [entry.slug, entry]));

export const HOME_TREND_SLUGS = ["cpi-all-items", "wpi-all-commodities"];

export const DASHBOARD_SLUGS = ["cpi-all-items", "cpi-food-and-beverages", "cpi-fuel-and-light", "wpi-all-commodities"];

export const COMPARISON_SLUGS = [
  "cpi-all-items",
  "cpi-food-and-beverages",
  "cpi-fuel-and-light",
  "wpi-all-commodities",
  "imf-cpi-all-items"
];

export const YOY_SLUGS = ["cpi-all-items", "cpi-food-and-beverages", "wpi-all-commodities"];

export const DATASET_CATALOG = DATASET_DEFINITIONS.reduce<Record<string, { description: string; source: string }>>((acc, definition) => {
  acc[definition.slug] = { description: definition.description, source: definition.source };
  return acc;
}, {});
