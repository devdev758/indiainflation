/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="node" />

type ArticleDefinition = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
};

type ArticleResult = {
  title: string;
  slug: string;
  url?: string;
  id?: number;
};

type Summary = {
  total: number;
  created: ArticleResult[];
  updated: ArticleResult[];
  skipped: ArticleResult[];
  failed: Array<{ title: string; slug: string; error: string }>;
};

type WordPressPost = {
  id: number;
  link?: string;
  content?: { raw?: string };
};

const articles: ArticleDefinition[] = [
  {
    title: "How CPI is Calculated in India",
    slug: "how-cpi-is-calculated-in-india",
    excerpt:
      "Understand the official CPI methodology in India, including household surveys, item weights, and how MOSPI updates the index every year.",
    content: `
      <p>The Consumer Price Index (CPI) measures how the cost of a fixed basket of goods and services changes for Indian households. The Ministry of Statistics and Programme Implementation (MOSPI) compiles the headline index for rural, urban, and combined India using data from the National Statistical Office (NSO). Each release captures price movements from more than 1,000 villages and 1,100 urban markets across the country.</p>
      <h2>1. Household survey and basket design</h2>
      <p>The base-year basket stems from the Consumer Expenditure Survey and reflects what households actually buy. Items are grouped into six major divisions such as Food &amp; Beverages, Housing, Clothing, Fuel &amp; Light, and Miscellaneous services. Each item is assigned a weight proportional to its share in the household budget. Food currently contributes roughly 45% of the combined CPI, while fuel and light contribute about 6%.</p>
      <h2>2. Field collection and price validation</h2>
      <p>Field staff collect thousands of price quotations every month from markets and government outlets. MOSPI runs automated validation to flag outliers and missing data. Prices are then averaged to produce an item-level index for each state and population segment. For seasonal goods, the index carries forward the last observed price or uses imputation so that the basket totals remain comparable.</p>
      <h2>3. Laspeyres index calculation</h2>
      <p>India follows a modified Laspeyres formula. Current-month prices are divided by base-year prices for every item and multiplied by the base-year weight. The sum of weighted relatives produces the overall index number. Because the basket is fixed, CPI measures how much more or less it costs to buy the same set of goods.</p>
      <h2>4. Linking and rebasing</h2>
      <p>Whenever MOSPI revises the base year (for example, 2004-05 to 2012) it splices the series so analysts can compare historical data. The authorities also publish linking factors to help translate legacy series into the new base.</p>
      <h2>5. How policymakers use CPI</h2>
      <p>The Reserve Bank of India targets 4% CPI inflation with a tolerance band of ±2%. State governments, wage boards, and tax authorities use the same index to adjust minimum wages, pensions, and welfare schemes. Investors track headline and core CPI to gauge the real interest rate and to price inflation-linked bonds.</p>
    `
  },
  {
    title: "Food Inflation Explained — Causes & Measures",
    slug: "food-inflation-explained",
    excerpt:
      "Track the drivers of food inflation in India and learn the policy levers—buffer stocks, imports, MSPs—that keep prices stable for households.",
    content: `
      <p>Food inflation dominates the Indian inflation narrative because cereals, milk, oils, and vegetables account for the largest share of household spending. A spike in tomato or onion prices can lift the all-India CPI within weeks. Understanding the drivers behind food inflation helps households plan purchases and helps founders design pricing strategies.</p>
      <h2>1. Weather and crop cycles</h2>
      <p>Monsoon rainfall and reservoir levels determine yields for kharif and rabi crops. Late rains or heat waves reduce supply, pushing prices higher. Horticulture crops such as onions and tomatoes are particularly vulnerable to weather shocks, which is why inflation often peaks between July and October.</p>
      <h2>2. Supply chain and logistics</h2>
      <p>India still loses an estimated 5–6% of fruits and vegetables in transit due to inadequate cold storage and fragmented mandis. Transport bottlenecks raise wholesale prices before they reach kirana stores. Digitised platforms, e-mandis, and refrigerated trucking can reduce wastage and stabilize retail prices.</p>
      <h2>3. Policy measures</h2>
      <ul>
        <li><strong>Buffer stocks:</strong> The Food Corporation of India releases grains to calm markets during shortages.</li>
        <li><strong>Trade tweaks:</strong> Export bans or reduced import duties on pulses and edible oils boost domestic supply.</li>
        <li><strong>MSP revisions:</strong> Minimum Support Price changes influence sowing decisions for the next season.</li>
      </ul>
      <h2>4. What households can do</h2>
      <p>Track weekly mandi bulletins, diversify staples (mix wheat, rice, and millets), and use the Indiainflation calculator to understand how sustained food inflation affects monthly budgets.</p>
    `
  },
  {
    title: "Using the India Inflation Calculator — Step-by-step",
    slug: "using-inflation-calculator",
    excerpt:
      "Learn how to convert historic rupee values into today’s prices, compare item inflation, and download CPI exports using the Indiainflation calculator.",
    content: `
      <p>The Indiainflation calculator converts past rupee amounts into current purchasing power. It uses the official MOSPI CPI series and the ETL exports that power our dashboards. Follow the walkthrough below to make the most of the tool.</p>
      <h2>Step 1: Choose an item or headline CPI</h2>
      <p>Select from all-India CPI, food, fuel, or item-level series such as milk and rice. The calculator automatically loads the latest CPI export produced by the Indiainflation ETL pipeline.</p>
      <h2>Step 2: Enter base and target months</h2>
      <p>Pick any month from 2012 onward. The calculator computes the index ratio between the two months and multiplies it by your rupee value to deliver an inflation-adjusted figure.</p>
      <h2>Step 3: Review YoY and MoM deltas</h2>
      <p>The tool highlights the year-on-year and month-on-month percentage changes so you can see whether inflation is accelerating or cooling.</p>
      <h2>Step 4: Download or share</h2>
      <p>Use the export button to download a CSV or JSON snapshot. Analysts can plug the data into financial models, while households can share charts with family members.</p>
      <p class="callout">Tip: Bookmark the calculators hub to compare inflation across multiple items and generate storytelling graphics for newsletters.</p>
    `
  },
  {
    title: "India CPI Basket 2024: Weights, Sources, and Updates",
    slug: "india-cpi-basket-2024",
    excerpt:
      "Break down the latest CPI basket for India, see how weights differ across rural and urban households, and track upcoming base-year revisions.",
    content: `
      <p>The 2012 base-year CPI basket covers 299 items in rural India and 304 items in urban India. The combined index blends both segments to produce the headline inflation number tracked by the RBI. Understanding the basket helps analysts build accurate forecasting models.</p>
      <h2>Category weights</h2>
      <ul>
        <li><strong>Food &amp; beverages:</strong> 45.9% (rural 54.2%, urban 36.3%)</li>
        <li><strong>Housing:</strong> 10.1% overall but 21.9% in urban CPI</li>
        <li><strong>Fuel &amp; light:</strong> 6.8%, reflecting LPG, kerosene, and electricity tariffs</li>
        <li><strong>Miscellaneous:</strong> 28.3%, covering health, education, transport, and communication</li>
      </ul>
      <h2>Data sources and frequency</h2>
      <p>Price quotes arrive from the Price Statistics Division using tablets and offline forms. Most perishables are captured weekly, while services such as education and healthcare are updated quarterly. The entire index is published with a 12–13 day lag after the reference month.</p>
      <h2>What changes in the next base revision</h2>
      <p>MOSPI plans to introduce a 2022-23 base with digitized sampling frames, higher coverage for services, and new weightings for digital goods. Expect higher weights for communication data plans, ready-to-eat food, and personal mobility.</p>
      <h2>How businesses can use basket insights</h2>
      <p>Founders can align their pricing strategy with items that carry heavier CPI weight, while researchers can link CPI divisions to private consumption data to forecast broader GDP trends.</p>
    `
  },
  {
    title: "Rural vs Urban Inflation Gap in India: What the Data Shows",
    slug: "rural-urban-inflation-gap-india",
    excerpt:
      "Compare rural and urban inflation momentum, learn why the gap opens up, and see which CPI divisions diverge the most across regions.",
    content: `
      <p>Rural and urban inflation do not always move in lockstep. Fuel taxes, food supply chains, and housing costs impact India’s cities and villages differently. Monitoring the gap helps policymakers design targeted relief measures.</p>
      <h2>Short-term drivers</h2>
      <p>Vegetable prices spike faster in cities because of logistics costs, while fuel subsidies cushion rural households. Conversely, housing inflation barely moves in rural CPI but heavily affects metropolitan centres.</p>
      <h2>Using Indiainflation data</h2>
      <p>Our ETL exports label every CPI series with geographic coverage, letting analysts compare the rural and urban index for each item. Use the comparison tool to visualise the spread for cereals, milk, and energy products.</p>
      <h2>Implications for policy</h2>
      <ul>
        <li><strong>Targeted subsidies:</strong> When rural inflation climbs faster, schemes like PM-KISAN can be front-loaded.</li>
        <li><strong>Urban transport pricing:</strong> Higher urban inflation often stems from fuel and transportation taxes, suggesting room for temporary duty cuts.</li>
        <li><strong>State-level planning:</strong> States with large rural populations can align welfare schemes with local CPI rather than the national average.</li>
      </ul>
    `
  },
  {
    title: "CPI vs WPI in India: Key Differences and Use Cases",
    slug: "cpi-vs-wpi-difference-india",
    excerpt:
      "Learn how CPI and WPI differ in coverage, weights, and policy relevance, and when analysts should lean on one index over the other.",
    content: `
      <p>India publishes two major price indices: the Consumer Price Index (CPI) and the Wholesale Price Index (WPI). While CPI captures retail prices paid by households, WPI tracks wholesale transactions for producers. Analysts often misinterpret the two, so understanding the differences is critical.</p>
      <h2>Coverage and methodology</h2>
      <p>CPI is consumption-focused with heavy weights for services and housing. WPI covers primary articles, fuel, and manufactured products, but it excludes services entirely. CPI uses a Laspeyres formula with household expenditure weights, whereas WPI relies on a Paasche-type formula with base-year trade weights.</p>
      <h2>Policy relevance</h2>
      <p>The Reserve Bank of India targets CPI because it reflects consumer purchasing power. WPI remains useful for understanding input cost pressures and profit margins, especially for manufacturing and commodities.</p>
      <h2>How to use both indices together</h2>
      <ul>
        <li>Compare CPI food inflation with WPI vegetable prices to anticipate retail pass-through.</li>
        <li>Track WPI fuel inflation to forecast changes in administered energy prices.</li>
        <li>Use CPI services inflation to model wage negotiations and salary increments.</li>
      </ul>
      <p>Indiainflation publishes ETL exports for CPI, while WPI data can be merged from DPIIT releases to build complementary dashboards.</p>
    `
  },
  {
    title: "Inflation-Proof Budgeting for Indian Households: Practical Tips",
    slug: "inflation-proof-budgeting-india",
    excerpt:
      "Protect monthly budgets from rising prices with data-driven tips covering groceries, utilities, schooling, and long-term savings goals.",
    content: `
      <p>High and sticky inflation stretches household budgets. The good news: a few data-led tweaks can protect savings without cutting essential spending. Use the Indiainflation calculators to quantify how far each rupee goes and the tips below to stay in control.</p>
      <h2>Track essentials separately</h2>
      <p>Split monthly spending into three buckets: food, housing &amp; utilities, and discretionary services. Compare each bucket with the corresponding CPI division to spot the fastest-moving costs.</p>
      <h2>Lock in medium-term prices</h2>
      <p>Advance-purchase school supplies, prepay tuition where discounts apply, and consider fixed-rate energy plans if your DISCOM offers them. Bulk purchasing during harvest months helps avoid festival-season spikes.</p>
      <h2>Boost inflation-linked savings</h2>
      <p>Look at RBI floating rate savings bonds, inflation-indexed bank deposits, and SIPs in short-duration debt funds that react quickly to rate hikes. Maintain an emergency fund covering至少 six months of essential expenditure.</p>
      <h2>Share data within the family</h2>
      <p>Use Indiainflation dashboards during household budget meetings. When everyone understands the price momentum, it becomes easier to align on savings targets and discretionary spend.</p>
    `
  }
];

function optionalEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value.trim();
    }
  }
  return undefined;
}

function requireEnv(...names: string[]): string {
  const value = optionalEnv(...names);
  if (!value) {
    throw new Error(`Missing required environment variable: ${names.join("/")}`);
  }
  return value;
}

function normaliseBase(raw: string): string {
  return raw.replace(/\s+/g, "").replace(/\/*$/, "");
}

function buildUrl(base: string, path: string, params?: Record<string, string>): string {
  if (base.includes("rest_route")) {
    const url = new URL(base);
    const route = url.searchParams.get("rest_route") ?? "/";
    const combined = `${route.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`.replace(/\/+/g, "/");
    url.searchParams.set("rest_route", combined.startsWith("/") ? combined : `/${combined}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  const url = new URL(path.replace(/^\/+/, ""), `${base}/`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function request<T>(rawBase: string, authHeader: string, path: string, init?: RequestInit, params?: Record<string, string>): Promise<T> {
  const url = path.startsWith("http") ? path : buildUrl(rawBase, path, params);
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader,
      ...(init?.headers ?? {})
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`WordPress API error ${response.status}: ${text}`);
  }

  return text ? (JSON.parse(text) as T) : ({} as T);
}

async function upsertArticle(base: string, authHeader: string, article: ArticleDefinition): Promise<{ status: "created" | "updated"; result: ArticleResult }> {
  const candidates = await request<WordPressPost[]>(base, authHeader, "wp/v2/posts", { method: "GET" }, {
    slug: article.slug,
    per_page: "1",
    context: "edit"
  });

  if (candidates.length > 0) {
    const existing = candidates[0];
    const updated = await request<WordPressPost>(base, authHeader, `wp/v2/posts/${existing.id}`, {
      method: "POST",
      body: JSON.stringify({
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        status: "publish"
      })
    });

    return {
      status: "updated",
      result: { title: article.title, slug: article.slug, id: updated.id, url: updated.link }
    };
  }

  const created = await request<WordPressPost>(base, authHeader, "wp/v2/posts", {
    method: "POST",
    body: JSON.stringify({
      title: article.title,
      slug: article.slug,
      content: article.content,
      excerpt: article.excerpt,
      status: "publish"
    })
  });

  return {
    status: "created",
    result: { title: article.title, slug: article.slug, id: created.id, url: created.link }
  };
}

async function main() {
  const apiBase = normaliseBase(requireEnv("INDIAINFLATION_WP_API_BASE", "WP_API_BASE", "WP_JSON_BASE"));
  const user = requireEnv("INDIAINFLATION_WP_ADMIN_USER", "WP_ADMIN_USER");
  const appPassword = requireEnv("INDIAINFLATION_WP_APP_PASSWORD", "WP_APP_PASSWORD");
  const authHeader = `Basic ${Buffer.from(`${user}:${appPassword}`).toString("base64")}`;

  const summary: Summary = {
    total: 0,
    created: [],
    updated: [],
    skipped: [],
    failed: []
  };

  for (const article of articles) {
    try {
      const { status, result } = await upsertArticle(apiBase, authHeader, article);
      summary.total += 1;
      summary[status].push(result);
    } catch (error) {
      summary.failed.push({
        title: article.title,
        slug: article.slug,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (summary.failed.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }, null, 2));
  process.exitCode = 1;
});
