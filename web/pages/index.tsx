import Head from "next/head";
import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, BarChart, Bar } from "recharts";

import { apiClient } from "@/components/apiClient";
import { FooterSection } from "@/components/layout/FooterSection";
import { HeroSection } from "@/components/layout/HeroSection";
import { useLatestInflation, useTrends, useCompare, useGroups, useStatewise } from "@/hooks/useInflationData";

const CPI_SECTOR_OPTIONS = ["Combined", "Urban", "Rural"];
const DEFAULT_CPI_GROUP = "All Items";
const DEFAULT_WPI_CATEGORY = "All Commodities";

function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

function formatMonth(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function buildSummaryCards(latestData: ReturnType<typeof useLatestInflation>["data"]): Array<{ title: string; value: string; caption: string }> {
  if (!latestData) return [];

  const latestCpi = latestData.find((entry) => entry.dataset === "CPI" && entry.major_group === "All Items" && entry.sector === "Combined");
  const latestFood = latestData.find((entry) => entry.dataset === "CPI" && entry.major_group === "Food & Beverages" && entry.sector === "Combined");
  const latestWpi = latestData.find((entry) => entry.dataset === "WPI" && entry.major_group === "All Commodities");

  return [
    {
      title: "Headline CPI YoY",
      value: formatPercent(latestCpi?.yoy_inflation_rate),
      caption: latestCpi ? formatMonth(latestCpi.observation_month) : "--"
    },
    {
      title: "Food CPI YoY",
      value: formatPercent(latestFood?.yoy_inflation_rate),
      caption: latestFood ? formatMonth(latestFood.observation_month) : "--"
    },
    {
      title: "WPI YoY",
      value: formatPercent(latestWpi?.yoy_inflation_rate ?? null),
      caption: latestWpi ? formatMonth(latestWpi.observation_month) : "--"
    }
  ];
}

export default function Home() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/`;
  const ogImage = `${siteUrl.replace(/\/$/, "")}/api/og?title=${encodeURIComponent("India Inflation Calculator")}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Indiainflation",
    url: siteUrl,
    description:
      "Explore India’s inflation trends, convert historical prices, and read CPI analysis with Indiainflation calculators and dashboards.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/items/{search_term}`,
      "query-input": "required name=search_term"
    }
  };

  const { data: latestData, isLoading: latestLoading, error: latestError } = useLatestInflation();
  const { data: trendData, isLoading: trendsLoading, error: trendsError } = useTrends(24);

  const [compareSector, setCompareSector] = useState("Combined");
  const [compareCpiGroup, setCompareCpiGroup] = useState(DEFAULT_CPI_GROUP);
  const [compareWpiCategory, setCompareWpiCategory] = useState(DEFAULT_WPI_CATEGORY);
  const [compareMonths, setCompareMonths] = useState(12);

  const { data: compareData, isLoading: compareLoading, error: compareError } = useCompare(compareSector, compareCpiGroup, compareWpiCategory, compareMonths);

  const summaryCards = useMemo(() => buildSummaryCards(latestData), [latestData]);
  const trendSeries = useMemo(() => trendData ?? [], [trendData]);
  const compareSeries = useMemo(() => compareData ?? [], [compareData]);

  return (
    <>
      <Head>
        <title>India Inflation Calculator & CPI Insights | Indiainflation</title>
        <meta
          name="description"
          content="Explore India’s inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Indiainflation" />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="India Inflation Calculator & CPI Insights" />
        <meta
          name="twitter:description"
          content="Explore India’s inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts."
        />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 pt-10 md:px-6">
        <HeroSection
          eyebrow="Trusted inflation intelligence for India"
          title="India Inflation Calculator"
          description="Analyse consumer price changes, compare essential items, and translate historic rupee amounts into today’s terms with live CPI data."
          primaryCta={{ href: "/cpi-dashboard", label: "Open dashboard" }}
          secondaryCta={{ href: "/compare", label: "Compare CPI vs WPI" }}
          highlight={
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-blue-500">Headline CPI YoY</p>
              <p className="mt-2 text-3xl font-semibold text-blue-900">{summaryCards[0]?.value ?? "--"}</p>
              <p className="text-xs text-blue-600">{summaryCards[0]?.caption ?? "--"}</p>
            </div>
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => (
            <div key={card.title} className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.title}</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.caption}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Inflation trend (24 months)</h2>
              <p className="text-sm text-slate-500">CPI headline and WPI categories</p>
            </div>
            {trendsError ? <p className="text-sm text-rose-600">Failed to load trend data.</p> : null}
          </header>
          <div className="mt-6 h-80 w-full">
            {trendsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading trend data…</div>
            ) : trendSeries.length ? (
              <ResponsiveContainer>
                <LineChart data={trendSeries.map((entry) => ({
                  date: formatMonth(entry.observation_month),
                  [`${entry.dataset}-${entry.label}`]: entry.index_value
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {[...new Set(trendSeries.map((entry) => `${entry.dataset}-${entry.label}`))].map((key, index) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={index === 0 ? "#2563eb" : "#22c55e"} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No trend data available.</div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
          <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Compare CPI vs WPI</h2>
              <p className="text-sm text-slate-500">Select segment and timeframe to compare index levels and YoY.</p>
            </div>
            {compareError ? <p className="text-sm text-rose-600">Failed to load comparison data.</p> : null}
          </header>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sector</label>
              <select
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={compareSector}
                onChange={(event) => setCompareSector(event.target.value)}
              >
                {CPI_SECTOR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">CPI major group</label>
              <input
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={compareCpiGroup}
                onChange={(event) => setCompareCpiGroup(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">WPI category</label>
              <input
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={compareWpiCategory}
                onChange={(event) => setCompareWpiCategory(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Months</label>
              <input
                type="number"
                min={3}
                max={60}
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={compareMonths}
                onChange={(event) => setCompareMonths(Number(event.target.value))}
              />
            </div>
          </div>

          <div className="mt-6 h-80 w-full">
            {compareLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading comparison…</div>
            ) : compareSeries.length ? (
              <ResponsiveContainer>
                <LineChart data={compareSeries.map((entry) => ({
                  date: formatMonth(entry.observation_month),
                  [`${entry.dataset}-index`]: entry.index_value,
                  [`${entry.dataset}-yoy`]: entry.yoy_inflation_rate
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="CPI-index" stroke="#2563eb" strokeWidth={2} dot={false} name="CPI Index" />
                  <Line yAxisId="left" type="monotone" dataKey="WPI-index" stroke="#f97316" strokeWidth={2} dot={false} name="WPI Index" />
                  <Line yAxisId="right" type="monotone" dataKey="CPI-yoy" stroke="#22c55e" strokeWidth={1.5} dot={false} name="CPI YoY" />
                  <Line yAxisId="right" type="monotone" dataKey="WPI-yoy" stroke="#881337" strokeWidth={1.5} dot={false} name="WPI YoY" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No comparison data.</div>
            )}
          </div>
        </section>

        <FooterSection />
      </div>
    </>
  );
}
