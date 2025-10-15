/* eslint-disable @typescript-eslint/no-unused-vars */
/// <reference types="node" />

import { ArticleDefinition, ArticlePublishSummary, ArticleResult, WordPressPost } from "../types/articleTypes";

const articles: ArticleDefinition[] = [
  {
    title: "India Inflation Timeline 1958–2025: Key Milestones",
    slug: "india-inflation-timeline-1958-2025",
    excerpt:
      "Trace India’s inflation journey from the 1958 wholesale disruptions to the contemporary CPI regime, including oil shocks, liberalisation, and GST rollout milestones.",
    content: `
      <p>India’s inflation story stretches across agricultural reforms, oil price shocks, liberalisation, and the rise of services. Analysts comparing long-run CPI and WPI trends need more than a single chart—they need the narrative arc behind the numbers. This guide summarises the biggest turning points from 1958 to the present and links each to the Indiainflation datasets powering dashboards in Phase 3.</p>
      <h2>1958–1979: Supply shocks and the Green Revolution</h2>
      <p>The late 1950s exposed India’s dependence on monsoon-sensitive agriculture. Wholesale prices surged when harvests failed, while CPI remained relatively anchored thanks to rationing. The 1960s Green Revolution stabilised cereals, yet the 1973 oil embargo imported inflation overnight. WPI fuel inflation jumped above 30%, while CPI food surged with a three-month lag. Analysts can replicate the episode using <strong>wpi-all-commodities</strong> and rural cereals data from Indiainflation’s ETL exports.</p>
      <h2>1980–1991: Administered prices and deficit monetisation</h2>
      <p>The 1980s saw controlled fuel pricing and high fiscal deficits. CPI averaged 8–9%, but wholesale inflation spiked whenever oil prices moved. The 1991 balance-of-payments crisis forced a devaluation and fuel price hikes, pushing WPI inflation to 13%. RBI’s transition to indirect monetary tools began here—compare repo rate series with CPI in the <em>monetary-policy</em> dashboard template.</p>
      <h2>1992–2008: Liberalisation to globalisation</h2>
      <p>Liberalisation widened India’s consumption basket. Services gained weight, especially housing and transport. The 2000s commodity boom sent WPI above 12% while CPI (combined) hovered near 6%, underscoring the divergence between producer and consumer indices. Use Indiainflation’s <code>Phase3ItemDataset</code> utilities to overlay core CPI with WPI manufactured products.</p>
      <h2>2009–2014: CPI takes centre stage</h2>
      <p>MOSPI adopted the new combined CPI in 2012, enabling consistent national tracking. Food inflation dominated headlines as pulses and vegetables rallied. RBI’s Urjit Patel committee recommended targeting 4% CPI with a tolerance band, reshaping monetary policy communications. Download the <strong>milk</strong> and <strong>rice</strong> exports to visualise how staple inflation drove headline numbers.</p>
      <h2>2015–2020: GST, demonetisation, and inflation targeting</h2>
      <p>The GST rollout initially pushed services inflation higher, while demonetisation induced a transient deflation in cash-heavy segments. CPI averaged close to the 4% target until late 2019, when food inflation resurfaced. Cross-plot CPI rural food with urban services to see how the gap narrowed.</p>
      <h2>2020–2025: Pandemic, supply chains, and digital consumption</h2>
      <p>COVID-19 supply shocks elevated CPI above 6% for long stretches. Freight snarls, commodity volatility, and weather extremes kept inflation sticky. The Phase 3 ETL pipeline extends data back to 1958, letting researchers assess whether today’s divergence between WPI and CPI mirrors previous crises.</p>
      <h3>How to use this timeline in dashboards</h3>
      <ul>
        <li>Merge Indiainflation CPI exports with RBI policy rate releases to narrate cause-and-effect timelines.</li>
        <li>Overlay WPI and CPI series to visualise producer-to-consumer pass-through.</li>
        <li>Use the Phase 3 comparison tool to show how states reacted differently to nationwide shocks.</li>
      </ul>
      <p class="callout">Download the timeline CSV from the Phase 3 validation report to embed these milestones into stakeholder briefings.</p>
    `
  },
  {
    title: "State-Level CPI Heatmap: Which Regions Lead Price Pressures?",
    slug: "state-level-cpi-heatmap-2025",
    excerpt:
      "Use Phase 3 regional exports to rank Indian states by CPI momentum, identify persistent outliers, and brief leadership teams on inflation hotspots.",
    content: `
      <p>With Indiainflation’s regional CPI exports, analysts can stop guessing which states pull headline inflation higher. This long-form study walks through building a state-level heatmap, interpreting divergence, and translating insights into business or policy action.</p>
      <h2>1. Build the dataset</h2>
      <p>Start by loading <code>loadPhase3Items(["milk", "rice", "wpi-all-commodities"])</code>. Each dataset now ships with <strong>regional_series</strong>, enumerating codes, friendly names, and index rows. Use <code>collectRegionOptions</code> to populate filters and <code>getRegionSeries</code> to fetch state-specific trends.</p>
      <h2>2. Construct the heatmap</h2>
      <ol>
        <li>Choose a time window—Indiainflation’s dashboard defaults to the last 24 months.</li>
        <li>Compute quarterly averages per state to smooth volatility.</li>
        <li>Assign z-scores across states for each quarter to highlight persistent outliers.</li>
      </ol>
      <p>The result is a heatmap where deep blues show subdued inflation and warm ambers signal pressure. Overlay RBI’s CPI tolerance band to contextualise risk.</p>
      <h2>3. Spotlight structural outliers</h2>
      <p>State divergences often stem from supply chain dependencies. For example, onion price spikes hit Maharashtra and Karnataka harder than the North-East. Meanwhile, LPG price revisions lift urban inflation disproportionately. Summarise the drivers using bullet points beneath the heatmap.</p>
      <h2>4. Operational applications</h2>
      <ul>
        <li><strong>Retail pricing:</strong> Adjust promotions in states with sustained 2σ inflation.</li>
        <li><strong>Procurement:</strong> Hedge commodities sourced from high-inflation corridors.</li>
        <li><strong>Policy memos:</strong> Brief state secretariats with divergence reports generated via the compare tool.</li>
      </ul>
      <h2>5. Communicate with narratives</h2>
      <p>Pair the visual heatmap with short narratives explaining why gaps persist—logistics bottlenecks, power tariffs, or crop cycles. Indiainflation’s Phase 3 articles pack includes templates for board decks and townhall updates.</p>
      <p class="callout">Pro tip: Use the normalization toggle in the comparison tool to align baseline indices before highlighting divergence.</p>
    `
  },
  {
    title: "How Food Inflation Feeds Into Core CPI",
    slug: "food-inflation-core-cpi-link",
    excerpt:
      "Quantify how sustained food inflation leaks into core CPI through wages, logistics, and fuel, and learn mitigation tactics for businesses and policymakers.",
    content: `
      <p>Food inflation often looks like a temporary blip—until it nudges housing, education, and healthcare higher. This article translates econometric relationships into plain language and provides ready-to-use templates for scenario planning.</p>
      <h2>Stage 1: Immediate food price spikes</h2>
      <p>Vegetables and pulses react fastest to weather shocks. In Indiainflation’s dataset, <strong>milk</strong> and <strong>rice</strong> provide a reliable view of staples. A 10% month-on-month spike typically adds 40–50 bps to headline CPI.</p>
      <h2>Stage 2: Wage renegotiation</h2>
      <p>Households facing higher food bills push for wage adjustments. Core services—education, personal care, domestic help—respond with a 3–6 month lag. Track this through the <em>mom_pct</em> metric in Phase 3 exports.</p>
      <h2>Stage 3: Logistics and fuel feedback loop</h2>
      <p>Transporters pass higher diesel prices to retailers, widening the footprint of food inflation. Use the <strong>wpi-all-commodities</strong> series as an early warning indicator, especially for fuel and power.</p>
      <h2>Mitigation toolkit</h2>
      <ul>
        <li><strong>Inventory planning:</strong> Advance-purchase non-perishables when CPI food crosses 6% YoY.</li>
        <li><strong>Indexation clauses:</strong> Incorporate CPI-linked escalators in supplier contracts.</li>
        <li><strong>Menu engineering:</strong> Replace high-inflation ingredients with seasonal alternatives to protect margins.</li>
      </ul>
      <h2>Policy implications</h2>
      <p>For governments, targeted pulses imports or onion buffer releases can cap expectations. Monitor core CPI trends in the comparison dashboard to judge policy success.</p>
      <p class="callout">Download the accompanying spreadsheet to simulate how a 5% food inflation shock bleeds into core over four quarters.</p>
    `
  },
  {
    title: "Wholesale Price Index Playbook for Manufacturers",
    slug: "wpi-playbook-for-manufacturers",
    excerpt:
      "Turn WPI data into actionable dashboards for manufacturing finance teams, from input hedging to contract renegotiations and margin tracking.",
    content: `
      <p>Manufacturing CFOs rely on the Wholesale Price Index (WPI) to understand input costs before they hit retail shelves. While Indiainflation focuses on CPI, the Phase 3 ETL pipeline links CPI and WPI so teams can analyse pass-through dynamics inside one workspace.</p>
      <h2>Map your cost stack</h2>
      <p>Break costs into primary articles, fuel, and manufactured products. Use DPIIT’s WPI series alongside Indiainflation CPI exports to assign weights. A table like the one below helps translate datasets into board-level insights.</p>
      <table>
        <thead>
          <tr>
            <th>Component</th>
            <th>WPI Division</th>
            <th>Lead Indicator</th>
            <th>Lag to CPI</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cereals</td>
            <td>Primary Articles</td>
            <td>WPI cereals</td>
            <td>2 months</td>
          </tr>
          <tr>
            <td>Packaging</td>
            <td>Manufactured products</td>
            <td>WPI paper &amp; board</td>
            <td>3 months</td>
          </tr>
          <tr>
            <td>Fuel surcharge</td>
            <td>Fuel &amp; Power</td>
            <td>WPI diesel</td>
            <td>Immediate</td>
          </tr>
        </tbody>
      </table>
      <h2>Build a weekly cockpit</h2>
      <ol>
        <li>Ingest WPI CSVs using the Phase 3 pipeline.</li>
        <li>Merge with CPI items relevant to your products.</li>
        <li>Visualise spreads in the comparison tool to identify margin pressure.</li>
      </ol>
      <h2>Action checklist</h2>
      <ul>
        <li>Lock in wholesale contracts when WPI momentum exceeds CPI by 300 bps.</li>
        <li>Adjust MRPs gradually—indicators from Indiainflation highlight when consumers can absorb increases.</li>
        <li>Automate alerts: use the monthly refresh cron to flag when WPI crosses preset thresholds.</li>
      </ul>
      <p class="callout">Manufacturers can embed Indiainflation data into ERP dashboards by exporting JSON payloads and piping them into Power BI or Looker.</p>
    `
  },
  {
    title: "Inflation-Adjusted Salary Negotiations in 2025",
    slug: "inflation-adjusted-salary-negotiations-2025",
    excerpt:
      "HR teams and employees need a neutral inflation benchmark for 2025 salary talks. This guide combines CPI data with compensation strategies to keep agreements fair.",
    content: `
      <p>Salary negotiations hinge on credible inflation benchmarks. Indiainflation’s datasets let HR leaders model CPI-linked increments for headquarters and regional offices alike.</p>
      <h2>Baseline the conversation</h2>
      <p>Start with all-India CPI and layer in city-level CPI where available. For example, use the <strong>milk</strong> and <strong>rice</strong> item exports to quantify food inflation, then compare with housing and education CPI gleaned from MOSPI tables.</p>
      <h2>Segment employees</h2>
      <ul>
        <li><strong>Field teams:</strong> Tie increments to rural CPI items because their consumption basket differs.</li>
        <li><strong>Corporate staff:</strong> Focus on services inflation, especially education and transport.</li>
        <li><strong>Executives:</strong> Combine CPI with WPI manufactured goods to capture business cost pressures.</li>
      </ul>
      <h2>Design the increment formula</h2>
      <p>An example formula: <code>Base increment = max(4%, headline CPI 12m average)</code>. Add performance multipliers and location correction factors. Indiainflation dashboards offer YoY charts to support the narrative.</p>
      <h2>Communicate transparently</h2>
      <p>Share comparison charts showing how inflation trended over the review period. When CPI is volatile, commit to a mid-year adjustment triggered automatically when CPI breaches 6% for two consecutive months.</p>
      <p class="callout">Download the salary negotiation checklist bundled with this article to standardise HR reviews across offices.</p>
    `
  },
  {
    title: "Inflation Strategies for India’s Tier-II Cities",
    slug: "inflation-strategies-tier-2-cities",
    excerpt:
      "Tier-II cities feel inflation differently from metros. Learn how to tailor product pricing, savings plans, and civic interventions using regional CPI exports.",
    content: `
      <p>Tier-II cities such as Jaipur, Indore, and Coimbatore juggle agrarian linkages and fast-growing services sectors. Indiainflation’s Phase 3 data finally gives analysts regional CPI coverage detailed enough to design tailored strategies.</p>
      <h2>Understand the consumption mix</h2>
      <p>Rural-urban combined CPI often masks Tier-II specifics. Use the <code>regionMap</code> attribute inside <strong>Phase3ItemDataset</strong> to extract the relevant state CPI and compare it with national averages.</p>
      <h2>Consumer strategy</h2>
      <ul>
        <li><strong>Retailers:</strong> Bundle staples when state CPI food outpaces national averages for three months.</li>
        <li><strong>Fintechs:</strong> Offer inflation-indexed RD/SIP products triggered by CPI alerts.</li>
        <li><strong>City administrators:</strong> Use dashboards to time market interventions like subsidised vegetable outlets.</li>
      </ul>
      <h2>Infrastructure pricing</h2>
      <p>Infrastructure projects can index annuity payments to the state CPI to offset material cost spikes. Compare WPI metals with state CPI housing to keep contracts balanced.</p>
      <h2>Case study: Coimbatore</h2>
      <p>Coimbatore’s textile cluster faces imported cotton price fluctuations. Normalise <strong>wpi-all-commodities</strong> and Tamil Nadu CPI to quantify pass-through. Communicate results via the comparison tool, noting when consumer prices lag producer spikes.</p>
      <p class="callout">Toolkit download: a Tier-II inflation scorecard template that plugs directly into Indiainflation exports.</p>
    `
  },
  {
    title: "RBI Monetary Policy Tracker: Inflation Scenarios",
    slug: "rbi-monetary-policy-inflation-scenarios",
    excerpt:
      "Model three inflation scenarios for upcoming RBI policy reviews using Indiainflation datasets, WPI signals, and high-frequency indicators.",
    content: `
      <p>Financial institutions and startups alike monitor the Reserve Bank of India’s policy moves. This tracker article outlines scenario planning frameworks built on Indiainflation data.</p>
      <h2>Scenario architecture</h2>
      <ol>
        <li><strong>Base case:</strong> CPI trends back to 4.5% by Q4 FY25 with moderating food inflation.</li>
        <li><strong>Upside:</strong> Core CPI remains sticky at 5.5% due to services and housing.</li>
        <li><strong>Risk case:</strong> Another supply shock lifts CPI to 7% and WPI to double digits.</li>
      </ol>
      <h2>Inputs to monitor</h2>
      <ul>
        <li>Indiainflation CPI exports for milk, rice, and fuel surrogates.</li>
        <li>DPIIT WPI for manufactured goods.</li>
        <li>High-frequency indicators such as PMI and freight indices.</li>
      </ul>
      <h2>Communication cadence</h2>
      <p>Update dashboards weekly, but tailor policy briefs around the bi-monthly MPC meetings. Each brief should include charts from the compare tool, a headline paragraph, and actionable implications for lending rates.</p>
      <p class="callout">Download the RBI tracker worksheet to replicate the three-scenario model with editable assumptions.</p>
    `
  },
  {
    title: "Startup Pricing Models During High Inflation",
    slug: "startup-pricing-models-high-inflation",
    excerpt:
      "Founders need dynamic pricing frameworks when inflation swings. Combine Indiainflation CPI series with cohort behaviour to protect growth and margins.",
    content: `
      <p>Startups often under-index inflation risks, discounting heavily even as costs climb. Indiainflation’s granular CPI data lets revenue teams adopt evidence-backed pricing.</p>
      <h2>Step 1: Benchmark costs</h2>
      <p>Map direct and indirect cost drivers to CPI items. D2C food brands align with <strong>milk</strong>, <strong>rice</strong>, and edible oils; mobility startups track fuel surrogates via WPI.</p>
      <h2>Step 2: Choose a pricing response</h2>
      <ul>
        <li><strong>Value laddering:</strong> Introduce premium SKUs with inflation justification.</li>
        <li><strong>Smart discounts:</strong> Tie promotions to CPI cooling (e.g. automatic discount resets when YoY falls below 4%).</li>
        <li><strong>Subscription shields:</strong> Offer fixed-price bundles with transparent CPI clauses.</li>
      </ul>
      <h2>Step 3: Communicate with data stories</h2>
      <p>Use the Indiainflation dash to share monthly inflation explainers with cohorts. Consumers respond better when they see how CPI affects input costs.</p>
      <h2>Investor reporting</h2>
      <p>Include CPI overlays in investor updates to justify margin evolution. The Phase 3 dataset exports integrate seamlessly with BI tools for recurring reports.</p>
      <p class="callout">Download the startup pricing calculator template bundled with this article to plug in CPI values automatically.</p>
    `
  },
  {
    title: "Energy and Fuel Inflation Outlook for 2025",
    slug: "energy-fuel-inflation-outlook-2025",
    excerpt:
      "Project fuel and energy inflation scenarios for 2025 using WPI, CPI fuel components, and global crude assumptions.",
    content: `
      <p>Energy costs ripple through transport, manufacturing, and household budgets. This outlook blends Indiainflation CPI data with WPI and crude markers to build a fuel inflation playbook for 2025.</p>
      <h2>Global crude scenarios</h2>
      <p>Start with three crude price decks—USD 65/bbl (soft), USD 80/bbl (base), USD 100/bbl (stress). Map each to domestic fuel CPI using historical pass-through coefficients available in Indiainflation’s comparison datasets.</p>
      <h2>Domestic tax variables</h2>
      <p>Excise and VAT changes can amplify or cushion crude moves. Track policy announcements and plug them into a sensitivity table. Indiainflation’s monthly refresh ensures you have the latest CPI fuel index for calibration.</p>
      <h2>Impact on households and industry</h2>
      <ul>
        <li><strong>Households:</strong> Higher LPG and petrol costs reduce discretionary spend—highlight this in budgeting guides.</li>
        <li><strong>Industry:</strong> Manufacturing margins compress when fuel WPI outpaces CPI; plan hedges accordingly.</li>
        <li><strong>Logistics:</strong> Freight contracts should include automatic fuel escalation clauses tied to CPI fuel.</li>
      </ul>
      <p class="callout">Download the energy outlook sheet to mix-and-match crude assumptions with CPI data for internal reviews.</p>
    `
  },
  {
    title: "Build Inflation Dashboards with Indiainflation Data",
    slug: "build-inflation-dashboards-indiainflation",
    excerpt:
      "A practitioner’s guide to building production-grade CPI dashboards using Phase 3 exports, covering architecture, caching, and storytelling best practices.",
    content: `
      <p>Phase 3 opens up richly annotated CPI and WPI data. This article shows developers and analysts how to assemble a dashboard stack without reinventing the wheel.</p>
      <h2>Data ingestion</h2>
      <p>Start with the <code>loadPhase3Items</code> helper inside <code>@/lib/data/phase3</code>. For server-side usage, cache JSON exports in object storage and schedule refreshes with the monthly cron job (<code>infra/cron/phase3_refresh.cron</code>).</p>
      <h2>Transformations</h2>
      <ul>
        <li>Normalize indices with <code>deriveMetricValue</code> and the normalization toggle used in the comparison tool.</li>
        <li>Create time buckets (3, 6, 12 months) using <code>subtractMonths</code>.</li>
        <li>Aggregate regions with <code>collectRegionOptions</code> for filter lists.</li>
      </ul>
      <h2>Visual design</h2>
      <p>Leverage the upgraded blue-gray theme introduced in Phase 3. The <strong>CpiTrendChart</strong> component now supports bare and card variants, letting you embed charts in marketing pages or analytic consoles.</p>
      <h2>Deployment tips</h2>
      <p>Use ISR (static regeneration) on core routes such as <code>/cpi-dashboard</code>, <code>/compare</code>, and <code>/datasets</code> to keep data fresh without overloading the origin. Monitor revalidate intervals in <code>getStaticProps</code>.</p>
      <h2>Storytelling</h2>
      <p>Every chart needs a headline, a tension, and a takeaway. Align dashboards with the 10 SEO articles published in Phase 3 to drive organic discovery.</p>
      <p class="callout">Clone the sample Next.js dashboard repo referenced in this article to jump-start production deployments.</p>
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
    const current = url.searchParams.get("rest_route") ?? "/";
    const combined = `${current.replace(/\/$/, "")}/${path.replace(/^\/+/g, "")}`.replace(/\/+/g, "/");
    url.searchParams.set("rest_route", combined.startsWith("/") ? combined : `/${combined}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }
    return url.toString();
  }

  const url = new URL(path.replace(/^\/+/g, ""), `${base}/`);
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
  const summary: ArticlePublishSummary = {
    total: 0,
    created: [],
    updated: [],
    skipped: [],
    failed: []
  };

  if (process.env.DRY_RUN === "1") {
    summary.total = articles.length;
    summary.skipped = articles.map((article) => ({ title: article.title, slug: article.slug }));
    console.log(JSON.stringify({ dryRun: true, summary }, null, 2));
    return;
  }

  const apiBase = normaliseBase(requireEnv("INDIAINFLATION_WP_API_BASE", "WP_API_BASE", "WP_JSON_BASE"));
  const user = requireEnv("INDIAINFLATION_WP_ADMIN_USER", "WP_ADMIN_USER");
  const appPassword = requireEnv("INDIAINFLATION_WP_APP_PASSWORD", "WP_APP_PASSWORD");
  const authHeader = `Basic ${Buffer.from(`${user}:${appPassword}`).toString("base64")}`;

  for (const article of articles) {
    try {
      const { status, result } = await upsertArticle(apiBase, authHeader, article);
      summary.total += 1;
      summary[status].push(result);
    } catch (error) {
      summary.total += 1;
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
