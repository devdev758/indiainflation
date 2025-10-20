import Head from "next/head";
import { useRef, useState, useMemo } from "react";
import { Download, RotateCcw, TrendingUp } from "lucide-react";
import { IndiaMap } from "@/components/IndiaMap";
import { useStatewiseInflation, formatMonthLabel, getMonthRange } from "@/hooks/useStatewiseInflation";
import {
  calculateStatewiseStats,
  exportStateDataAsCSV,
  exportMapAsPNG,
  sortByInflation,
  groupByRegion,
  StatewiseData,
} from "@/lib/mapUtils";
import { generateDatasetSchema, generateBreadcrumbSchema } from "@/lib/structuredData";

export default function StatewisePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/statewise`;

  const mapRef = useRef<HTMLDivElement>(null);

  // Get latest month for default
  const latestMonth = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return `${year}-${String(month).padStart(2, "0")}`;
  }, []);

  // State management
  const [selectedMonth, setSelectedMonth] = useState(latestMonth);
  const [sector, setSector] = useState<"Combined" | "Urban" | "Rural">("Combined");
  const [hoveredState, setHoveredState] = useState<StatewiseData | null>(null);
  const [viewType, setViewType] = useState<"map" | "table" | "regions">("map");

  // Generate month options (last 12 months)
  const monthOptions = useMemo(
    () => getMonthRange(12, latestMonth),
    [latestMonth]
  );

  // Fetch data
  const { data: statewiseData, isLoading, error } = useStatewiseInflation(selectedMonth, sector);

  // Calculate stats
  const stats = useMemo(() => {
    if (!statewiseData?.data || statewiseData.data.length === 0) return undefined;
    return calculateStatewiseStats(statewiseData.data);
  }, [statewiseData]);

  // Group data by region
  const groupedByRegion = useMemo(() => {
    if (!statewiseData?.data) return {};
    return groupByRegion(statewiseData.data);
  }, [statewiseData]);

  // Handle exports
  const handleExportCSV = () => {
    if (!statewiseData?.data) return;
    try {
      exportStateDataAsCSV(statewiseData.data, selectedMonth, sector);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export CSV");
    }
  };

  const handleExportPNG = async () => {
    if (!mapRef.current) return;
    try {
      await exportMapAsPNG(mapRef.current, selectedMonth);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export PNG");
    }
  };

  // Reset filters
  const handleReset = () => {
    setSelectedMonth(latestMonth);
    setSector("Combined");
    setViewType("map");
  };

  // SEO schemas
  const datasetSchema = generateDatasetSchema({
    name: "State-wise Inflation in India (Latest CPI Data)",
    description: "Interactive map and data showing state-level CPI and YoY inflation rates across India",
    url: canonicalUrl,
    keywords: ["state-wise inflation", "CPI by state", "India inflation map", "regional inflation"],
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "State-wise Analysis", url: canonicalUrl },
  ]);

  return (
    <>
      <Head>
        <title>State-wise Inflation in India | CPI by State | Indiainflation</title>
        <meta
          name="description"
          content="Interactive map showing state-level CPI and inflation rates across India. Compare inflation trends by state, sector (urban/rural), and time period."
        />
        <meta
          name="keywords"
          content="state-wise inflation, CPI by state, regional inflation, India inflation map, state inflation rates"
        />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content="State-wise Inflation in India" />
        <meta
          property="og:description"
          content="Interactive map of state-level inflation rates across India with detailed CPI analysis"
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="State-wise Inflation in India" />
        <meta name="twitter:description" content="State-level CPI data and inflation rates" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-10 md:px-6">
        {/* Hero Section */}
        <section className="rounded-3xl bg-gradient-to-br from-green-600 via-emerald-500 to-teal-500 p-8 text-white shadow-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-green-100">Analysis</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              State-wise Inflation in India <span className="text-green-100">(Latest CPI Data)</span>
            </h1>
            <p className="max-w-3xl text-sm text-green-100">
              Explore inflation trends across Indian states and union territories. Compare CPI values, YoY inflation rates, and regional patterns with interactive maps and detailed analytics.
            </p>
          </div>
        </section>

        {/* Controls Section */}
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Filters & Controls</h2>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {/* Month Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Month/Year</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {monthOptions.map((month) => (
                  <option key={month} value={month}>
                    {formatMonthLabel(month)}
                  </option>
                ))}
              </select>
            </div>

            {/* Sector Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as "Combined" | "Urban" | "Rural")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Combined">Combined (All)</option>
                <option value="Urban">Urban Only</option>
                <option value="Rural">Rural Only</option>
              </select>
            </div>

            {/* View Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">View</label>
              <select
                value={viewType}
                onChange={(e) => setViewType(e.target.value as "map" | "table" | "regions")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="map">Map & Table</option>
                <option value="regions">By Region</option>
                <option value="table">Table Only</option>
              </select>
            </div>

            {/* Export Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Export</label>
              <div className="flex gap-2">
                <button
                  onClick={handleExportPNG}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  PNG
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={isLoading}
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Hovered State Info */}
        {hoveredState && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">{hoveredState.state}</p>
                <p className="text-sm text-slate-600">
                  CPI: {hoveredState.cpi_value.toFixed(2)} | YoY: {hoveredState.yoy_percent.toFixed(2)}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        )}

        {/* Content Section */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-500 mx-auto" />
              <p className="text-sm text-slate-600">Loading state-wise data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm text-red-700">Failed to load state-wise data. Please try again.</p>
          </div>
        ) : statewiseData?.data && statewiseData.data.length > 0 ? (
          <div ref={mapRef} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
            {/* Map View */}
            <IndiaMap
              data={statewiseData.data}
              stats={stats}
              onStateHover={setHoveredState}
              showRegions={true}
            />

            {/* Regional Summary */}
            {Object.keys(groupedByRegion).length > 0 && (
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900">Regional Summary</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.entries(groupedByRegion).map(([region, states]) => {
                    const avgInflation =
                      states.reduce((sum, s) => sum + s.yoy_percent, 0) / states.length;
                    return (
                      <div
                        key={region}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="font-semibold text-slate-900">{region}</p>
                        <p className="text-sm text-slate-600">
                          {states.length} {states.length === 1 ? "state" : "states"}
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-900">
                          {avgInflation.toFixed(2)}%
                        </p>
                        <p className="text-xs text-slate-600">Avg. YoY Inflation</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top/Bottom States */}
            {stats && (
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900">State Rankings</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Top 5 Highest */}
                  <div>
                    <h4 className="mb-3 font-semibold text-slate-900">Highest Inflation</h4>
                    <div className="space-y-2">
                      {sortByInflation(statewiseData.data, "desc")
                        .slice(0, 5)
                        .map((state, idx) => (
                          <div key={state.state} className="flex items-center justify-between rounded-lg bg-red-50 p-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-red-600">{idx + 1}.</span>
                              <span className="text-sm text-slate-900">{state.state}</span>
                            </div>
                            <span className="font-semibold text-red-600">{state.yoy_percent.toFixed(2)}%</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Top 5 Lowest */}
                  <div>
                    <h4 className="mb-3 font-semibold text-slate-900">Lowest Inflation</h4>
                    <div className="space-y-2">
                      {sortByInflation(statewiseData.data, "asc")
                        .slice(0, 5)
                        .map((state, idx) => (
                          <div key={state.state} className="flex items-center justify-between rounded-lg bg-green-50 p-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">{idx + 1}.</span>
                              <span className="text-sm text-slate-900">{state.state}</span>
                            </div>
                            <span className="font-semibold text-green-600">{state.yoy_percent.toFixed(2)}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm text-slate-600">No state-wise data available for this period.</p>
          </div>
        )}

        {/* Info Section */}
        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">About State-wise CPI</h3>
            <p className="text-sm text-slate-700">
              The Consumer Price Index (CPI) is calculated by the Ministry of Statistics &
              Programme Implementation (MoSPI) for each state and union territory of India.
            </p>
            <p className="text-sm text-slate-700">
              This visualization shows the latest available monthly CPI data with year-over-year (YoY)
              inflation rates, allowing comparison of inflation trends across different regions of India.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Data Sources</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>
                <strong>Ministry of Statistics & Programme Implementation (MoSPI):</strong> Official CPI data
              </li>
              <li>
                <strong>Update Frequency:</strong> Monthly (typically mid-month for previous month data)
              </li>
              <li>
                <strong>Sectors:</strong> Combined (overall), Urban, and Rural indices
              </li>
              <li>
                <strong>Base Year:</strong> 2011-12 = 100
              </li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-slate-900">Why do inflation rates vary so much by state?</p>
              <p className="mt-1 text-sm text-slate-700">
                Different states have different consumption baskets, local supply chains, and market
                dynamics. Urban and rural areas within states also have different inflation rates based
                on their access to goods and services.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">What do the colors on the map represent?</p>
              <p className="mt-1 text-sm text-slate-700">
                The colors represent YoY inflation rates: green indicates low inflation, yellow/orange
                indicates moderate inflation, and red indicates high inflation rates.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Can I compare different months or sectors?</p>
              <p className="mt-1 text-sm text-slate-700">
                Yes! Use the filter controls at the top to select different months (up to 12 months back)
                and sectors (Combined, Urban, or Rural). The map updates automatically with new data.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
