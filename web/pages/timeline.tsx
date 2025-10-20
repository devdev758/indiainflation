import Head from "next/head";
import { useRef, useState, useEffect } from "react";
import { Download, Maximize2, RotateCcw } from "lucide-react";
import { TimelineChart } from "@/components/TimelineChart";
import { useTimelineData } from "@/hooks/useTimelineData";
import { inflationAnnotations, getAnnotationsForRange } from "@/lib/annotations";
import { generateDatasetSchema, generateBreadcrumbSchema } from "@/lib/structuredData";

export default function TimelinePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/timeline`;

  // State management
  const [dataType, setDataType] = useState<"cpi" | "wpi">("cpi");
  const [sector, setSector] = useState<"combined" | "urban" | "rural">("combined");
  const [showYoY, setShowYoY] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [startYear, setStartYear] = useState(1958);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch data
  const { data: timelineData, isLoading, error } = useTimelineData({
    dataType,
    sector,
    fromDate: `${startYear}-01-01`,
    toDate: `${endYear}-12-31`,
  });

  // Get applicable annotations
  const applicableAnnotations = showAnnotations
    ? getAnnotationsForRange(startYear, endYear)
    : [];

  // Export to PNG
  const handleExportPNG = async () => {
    if (!chartRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#FFFFFF",
        scale: 2,
      });

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `inflation-timeline-${dataType}-${new Date().toISOString().split("T")[0]}.png`;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export chart. Please ensure html2canvas is installed.");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!timelineData?.data) return;

    const headers = ["Date", "Year", "Month", dataType.toUpperCase(), "YoY Inflation %", "Sector"];
    const rows = timelineData.data.map((point) => [
      point.date,
      point.year,
      point.month,
      point.value.toFixed(2),
      point.yoy_percent?.toFixed(2) || "N/A",
      sector,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const link = document.createElement("a");
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    link.download = `inflation-timeline-${dataType}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Reset filters
  const handleReset = () => {
    setDataType("cpi");
    setSector("combined");
    setStartYear(1958);
    setEndYear(new Date().getFullYear());
    setShowYoY(true);
    setShowAnnotations(true);
  };

  // SEO schemas
  const datasetSchema = generateDatasetSchema({
    name: "India's Inflation Timeline (1958–Present)",
    description: "Interactive timeline showing 66 years of CPI and WPI data for India with annotations of major economic events",
    url: canonicalUrl,
    keywords: ["inflation", "timeline", "CPI", "WPI", "India", "economic history", "1958-present"],
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Timeline", url: canonicalUrl },
  ]);

  return (
    <>
      <Head>
        <title>India's Inflation Timeline (1958–Present) | Indiainflation</title>
        <meta
          name="description"
          content="Interactive 66-year inflation timeline of India from 1958 to present. Explore CPI/WPI trends, major economic events, and key inflation milestones."
        />
        <meta
          name="keywords"
          content="inflation timeline, India CPI, WPI history, 1958-present, economic trends, inflation events"
        />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content="India's Inflation Timeline (1958–Present)" />
        <meta
          property="og:description"
          content="Interactive timeline showing 66 years of inflation data with major economic events"
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="India's Inflation Timeline" />
        <meta name="twitter:description" content="66 years of CPI/WPI data from 1958-present" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="mx-auto max-w-7xl space-y-8 px-4 pb-20 pt-10 md:px-6">
        {/* Hero Section */}
        <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-8 text-white shadow-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Analysis</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              India's Inflation Timeline <span className="text-blue-100">(1958–Present)</span>
            </h1>
            <p className="max-w-3xl text-sm text-blue-100">
              Explore 66 years of consumer price and wholesale price movements with annotations of major economic reforms, crises, and policy changes that shaped India's inflation dynamics.
            </p>
          </div>
        </section>

        {/* Controls Section */}
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Customize View</h2>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {/* Data Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Data Type</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value as "cpi" | "wpi")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cpi">CPI (Consumer)</option>
                <option value="wpi">WPI (Wholesale)</option>
              </select>
            </div>

            {/* Sector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as "combined" | "urban" | "rural")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="combined">Combined</option>
                <option value="urban">Urban</option>
                <option value="rural">Rural</option>
              </select>
            </div>

            {/* Start Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">From Year</label>
              <input
                type="number"
                min="1958"
                max={endYear - 1}
                value={startYear}
                onChange={(e) => setStartYear(Math.max(1958, Number(e.target.value)))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Year */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">To Year</label>
              <input
                type="number"
                min={startYear + 1}
                max={new Date().getFullYear()}
                value={endYear}
                onChange={(e) => setEndYear(Math.min(new Date().getFullYear(), Number(e.target.value)))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* YoY Toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showYoY}
                  onChange={(e) => setShowYoY(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-600">Show YoY %</span>
              </label>
            </div>

            {/* Annotations Toggle */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAnnotations}
                  onChange={(e) => setShowAnnotations(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-600">Show Events</span>
              </label>
            </div>
          </div>
        </section>

        {/* Chart Section */}
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Inflation Trends</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPNG}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                title="Export as PNG"
              >
                <Download className="h-4 w-4" />
                PNG
              </button>
              <button
                onClick={handleExportCSV}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                title="Export as CSV"
              >
                <Download className="h-4 w-4" />
                CSV
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 mx-auto" />
                <p className="text-sm text-slate-600">Loading timeline data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">Failed to load timeline data. Please try again.</p>
            </div>
          ) : timelineData?.data && timelineData.data.length > 0 ? (
            <div ref={chartRef} className="bg-white">
              <TimelineChart
                data={timelineData.data}
                annotations={applicableAnnotations}
                showYoY={showYoY}
                showAnnotations={showAnnotations}
                dataType={dataType}
                sector={sector}
              />
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-600">No data available for selected filters.</p>
            </div>
          )}
        </section>

        {/* Information Section */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* About */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">About This Timeline</h3>
            <p className="text-sm text-slate-700">
              This interactive timeline visualizes 66 years of inflation data from India's Ministry of Statistics & Programme Implementation (MoSPI) and Department of Industrial Policy & Promotion (DPIIT).
            </p>
            <p className="text-sm text-slate-700">
              Key annotations highlight major economic events that influenced inflation, including the 1991 economic reforms, global financial crises, and India's inflation targeting framework.
            </p>
          </div>

          {/* Key Metrics */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
            <h3 className="font-semibold text-slate-900">Data Coverage</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              <li>
                <strong>Period:</strong> 1958–Present ({endYear - startYear + 1} years)
              </li>
              <li>
                <strong>Data Types:</strong> CPI (Consumer Price Index) & WPI (Wholesale Price Index)
              </li>
              <li>
                <strong>Sectors:</strong> Combined, Urban, Rural
              </li>
              <li>
                <strong>Metrics:</strong> Index values and Year-over-Year inflation rates
              </li>
              <li>
                <strong>Sources:</strong> MoSPI, DPIIT, RBI official publications
              </li>
            </ul>
          </div>
        </section>

        {/* Annotations Reference */}
        {applicableAnnotations.length > 0 && (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900">Key Events & Milestones</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {applicableAnnotations.map((ann, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-slate-200 bg-white p-4 space-y-2"
                  style={{ borderLeftWidth: "4px", borderLeftColor: ann.color }}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-900">{ann.label}</p>
                    <span className="text-xs font-semibold text-slate-600">
                      {ann.year}
                      {ann.month && `-${String(ann.month).padStart(2, "0")}`}
                    </span>
                  </div>
                  {ann.description && (
                    <p className="text-sm text-slate-700">{ann.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-slate-900">What is the difference between CPI and WPI?</p>
              <p className="mt-1 text-sm text-slate-700">
                CPI (Consumer Price Index) measures price changes for goods and services bought by households. WPI (Wholesale Price Index) measures prices at the wholesale level before retail markup.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Why do inflation rates vary by sector?</p>
              <p className="mt-1 text-sm text-slate-700">
                Urban areas typically have different inflation patterns than rural areas due to consumption baskets, access to goods, and market dynamics.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-900">How often is the timeline data updated?</p>
              <p className="mt-1 text-sm text-slate-700">
                Data is updated monthly by MoSPI and typically released mid-month with a one-month lag. Our platform updates within 24-48 hours of official release.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
