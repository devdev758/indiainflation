const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUTPUT_DIR = path.join(__dirname, "..", "etl", "data", "exports", "items");

const SERIES_MONTHS = 12 * 20; // 20 years of monthly data
const START_YEAR = 2006;
const START_MONTH = 0; // January

const REGION_DEFS = [
  { code: "all-india", name: "All India", type: "nation", delta: 0 },
  { code: "delhi", name: "Delhi", type: "state", delta: 3.1 },
  { code: "maharashtra", name: "Maharashtra", type: "state", delta: 1.8 },
  { code: "karnataka", name: "Karnataka", type: "state", delta: -0.4 },
  { code: "kerala", name: "Kerala", type: "state", delta: 2.6 }
];

const SLUGS = [
  { slug: "cpi-all-items", name: "CPI All Items", base: 95, growth: 0.48, volatility: 1.3 },
  { slug: "cpi-food-and-beverages", name: "CPI Food & Beverages", base: 98, growth: 0.52, volatility: 1.6 },
  { slug: "cpi-fuel-and-light", name: "CPI Fuel & Light", base: 90, growth: 0.57, volatility: 2.4 },
  { slug: "wpi-all-commodities", name: "WPI All Commodities", base: 100, growth: 0.44, volatility: 1.1 },
  { slug: "imf-cpi-all-items", name: "IMF CPI All Items", base: 88, growth: 0.4, volatility: 0.9 }
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function addMonths(year, month, offset) {
  const total = year * 12 + month + offset;
  const nextYear = Math.floor(total / 12);
  const nextMonth = total % 12;
  return { year: nextYear, month: nextMonth };
}

function formatDate(year, month) {
  const mm = String(month + 1).padStart(2, "0");
  return `${year}-${mm}-01`;
}

function buildRegionSeries(base, monthlyGrowth, delta, volatility) {
  const entries = [];
  const history = new Map();
  let prevIndex = null;
  let prevYear = null;
  let prevMonth = null;
  let sum = 0;

  for (let i = 0; i < SERIES_MONTHS; i += 1) {
    const { year, month } = addMonths(START_YEAR, START_MONTH, i);
    const seasonal = Math.sin((i % 12) / 12 * Math.PI * 2) * volatility;
    const indexValue = Number((base + i * monthlyGrowth + delta + seasonal).toFixed(2));

    const key = `${year - 1}-${month}`;
    const ref = history.get(key);
    const yoy = ref ? Number((((indexValue / ref) - 1) * 100).toFixed(3)) : null;

    let mom = null;
    if (prevIndex != null && prevYear != null && prevMonth != null) {
      const prevTotal = prevYear * 12 + prevMonth;
      const currentTotal = year * 12 + month;
      if (currentTotal - prevTotal === 1 && prevIndex !== 0) {
        mom = Number((((indexValue / prevIndex) - 1) * 100).toFixed(3));
      }
    }

    entries.push({
      date: formatDate(year, month),
      index_value: indexValue,
      yoy_pct: yoy,
      mom_pct: mom
    });

    history.set(`${year}-${month}`, indexValue);
    prevIndex = indexValue;
    prevYear = year;
    prevMonth = month;
    sum += indexValue;
  }

  const metadata = {
    first_date: entries[0]?.date ?? null,
    last_date: entries.at(-1)?.date ?? null,
    count: entries.length,
    last_index_value: entries.at(-1)?.index_value ?? null,
    average_index_value: entries.length ? Number((sum / entries.length).toFixed(3)) : null
  };

  return { entries, metadata };
}

function buildPayload(def) {
  const regionalSeries = REGION_DEFS.map((region) => {
    const { entries, metadata } = buildRegionSeries(def.base, def.growth, region.delta, def.volatility);
    return {
      code: region.code,
      name: region.name,
      type: region.type,
      series: entries,
      metadata
    };
  });

  const defaultRegion = regionalSeries.find((region) => region.code === "all-india") ?? regionalSeries[0];

  return {
    slug: def.slug,
    name: def.name,
    default_region: defaultRegion.code,
    metadata: defaultRegion.metadata,
    series: defaultRegion.series,
    regions: REGION_DEFS.map((region) => ({ code: region.code, name: region.name, type: region.type })),
    regional_series: regionalSeries,
    generated_at: new Date().toISOString(),
    export_schema_version: "v2"
  };
}

function writeGzipJson(destination, payload) {
  ensureDir(path.dirname(destination));
  const json = JSON.stringify(payload, null, 2);
  const buffer = zlib.gzipSync(json);
  fs.writeFileSync(destination, buffer);
  console.log(`Wrote ${destination}`);
}

function main() {
  ensureDir(OUTPUT_DIR);
  for (const def of SLUGS) {
    const payload = buildPayload(def);
    const outPath = path.join(OUTPUT_DIR, `${def.slug}.json.gz`);
    writeGzipJson(outPath, payload);
  }
}

if (require.main === module) {
  main();
}
