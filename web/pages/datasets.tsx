import Head from "next/head";
import { useMemo, useState } from "react";
import { Search, Info } from "lucide-react";
import { DatasetTable } from "@/components/DatasetTable";
import { ExportButtons } from "@/components/ExportButtons";
import { useHistoricalCPI } from "@/hooks/useDatasets";
import { 
  filterDataByRange, 
  filterDataBySector, 
  sortByDate
} from "@/lib/dataUtils";
import { generateDatasetSchema } from "@/lib/structuredData";
import type { DatasetRecord } from "@/lib/dataUtils";

export default function DatasetsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/datasets`;

  // Filter states
  const [datasetType, setDatasetType] = useState<"cpi" | "wpi">("cpi");
  const [sector, setSector] = useState<"Combined" | "Urban" | "Rural" | "All">("Combined");
  const [dateRange, setDateRange] = useState<{ from: string | null; to: string | null }>({
    from: null,
    to: null,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch data
  const { data: cpiData, isLoading, error } = useHistoricalCPI({
    fromDate: dateRange.from,
    toDate: dateRange.to,
  });

  // Transform and filter data
  const filteredData = useMemo(() => {
    if (!cpiData?.data) return [];

    let filtered = cpiData.data.map((point) => ({
      date: point.date,
      indexValue: point.cpi_value,
      yoyPercent: null,
      category: "All Items",
      sector: point.sector || "Combined",
      source: "MoSPI CPI All-India",
    } as DatasetRecord));

    // Apply sector filter
    if (sector !== "All") {
      filtered = filterDataBySector(
        filtered.map((r) => ({ date: r.date, cpi_value: r.indexValue, sector: r.sector })),
        sector
      ).map((point) => ({
        date: point.date,
        indexValue: point.cpi_value,
        yoyPercent: null,
        category: "All Items",
        sector: point.sector || "Combined",
        source: "MoSPI CPI All-India",
      }));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.date.includes(query) ||
          record.category.toLowerCase().includes(query) ||
          record.sector.toLowerCase().includes(query)
      );
    }

    return sortByDate(
      filtered.map((r) => ({ 
        date: r.date, 
        cpi_value: r.indexValue, 
        sector: r.sector 
      })),
      "desc"
    ).map((point) => ({
      date: point.date,
      indexValue: point.cpi_value,
      yoyPercent: null,
      category: "All Items",
      sector: point.sector || "Combined",
      source: "MoSPI CPI All-India",
    }));
  }, [cpiData?.data, sector, searchQuery]);

  const datasetSchema = generateDatasetSchema({
    name: "Indian CPI & WPI Historical Data",
    description: "Complete historical CPI and WPI data from 1958-present",
    url: canonicalUrl,
  });

  return (
    <>
      <Head>
        <title>Indian Inflation Datasets (CPI & WPI) | Indiainflation</title>
        <meta
          name="description"
          content="Browse and download historical CPI and WPI data from India (1958-present). Filter by sector, year, and category. Export to CSV or JSON."
        />
        <meta
          name="keywords"
          content="CPI data India, WPI data, inflation datasets, economic data download, MoSPI data"
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="Indian Inflation Datasets | Indiainflation" />
        <meta property="og:description" content="Browse and download historical CPI & WPI datasets" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      </Head>

      <div className="mx-auto max-w-7xl space-y-12 px-4 pb-20 pt-10 md:px-6">
        {/* Hero Section */}
        <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-8 text-white shadow-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Datasets</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Indian Inflation Datasets</h1>
            <p className="max-w-3xl text-sm text-blue-100">
              Access comprehensive historical CPI and WPI data from 1958 to present. Filter, search, and export data in your preferred format.
            </p>
          </div>
        </section>

        {/* Data Source Info */}
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex gap-3">
          <Info className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium">Data Sources</p>
            <p className="mt-1 text-blue-800">
              Data sourced from <strong>Ministry of Statistics & Programme Implementation (MoSPI)</strong> and{" "}
              <strong>Department for Promotion of Industry & Internal Trade (DPIIT)</strong>, normalized and maintained by
              IndiaInflation.com
            </p>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => setDatasetType("cpi")}
            className={`px-4 py-3 font-medium transition ${
              datasetType === "cpi"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            CPI (Consumer Price Index)
          </button>
          <button
            onClick={() => setDatasetType("wpi")}
            className={`px-4 py-3 font-medium transition ${
              datasetType === "wpi"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            WPI (Wholesale Price Index)
          </button>
        </div>

        {/* Filters Section */}
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Filters & Search</h2>

          <div className="grid gap-4 md:grid-cols-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by date, category, sector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Sector Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value as any)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Sectors</option>
                <option value="Combined">Combined</option>
                <option value="Urban">Urban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>

            {/* Date Range (simplified year picker) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Year Range</label>
              <select
                value={dateRange.from ? dateRange.from.substring(0, 4) : ""}
                onChange={(e) => {
                  const year = e.target.value;
                  if (year) {
                    setDateRange({ from: `${year}-01`, to: `${year}-12` });
                  } else {
                    setDateRange({ from: null, to: null });
                  }
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Years (1958-Present)</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2020">2020</option>
                <option value="2015">2015</option>
                <option value="2010">2010</option>
                <option value="2000">2000</option>
                <option value="1990">1990</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => {
              setSearchQuery("");
              setSector("Combined");
              setDateRange({ from: null, to: null });
            }}
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Reset all filters
          </button>
        </section>

        {/* Results and Export */}
        <section className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-600">
                {filteredData.length} records found
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            </div>
            <ExportButtons data={filteredData} filename={`${datasetType}-data-${new Date().toISOString().split("T")[0]}`} variant="compact" />
          </div>

          {/* Data Table */}
          <DatasetTable
            data={filteredData}
            isLoading={isLoading}
            pageSize={25}
            onViewTrend={(date) => {
              // Navigate to compare page with date pre-selected
              window.location.href = `/compare?from_date=${date}`;
            }}
          />
        </section>

        {/* Export Section */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 font-semibold text-slate-900">Download Full Dataset</h2>
          <ExportButtons data={filteredData} filename={`${datasetType}-data-${new Date().toISOString().split("T")[0]}`} />
        </section>

        {/* Help Section */}
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-3">
          <h3 className="font-semibold text-slate-900">How to Use This Tool</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
            <li>Use filters to narrow down the dataset by sector, year, or search terms</li>
            <li>Click on column headers to sort by date, index value, or YoY inflation</li>
            <li>Click "Trend" to view historical charts for a specific data point</li>
            <li>Export filtered results as CSV (for Excel/Sheets) or JSON (for API/programming use)</li>
            <li>All data exports include metadata about the source and export date</li>
          </ul>
        </section>

        {/* Related Links */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
          <h3 className="font-semibold text-slate-900">Related Tools</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <a
              href="/inflation-calculator"
              className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm hover:bg-blue-100"
            >
              <p className="font-medium text-blue-900">Inflation Calculator</p>
              <p className="mt-1 text-blue-800">Convert historical rupee values to current prices</p>
            </a>
            <a
              href="/cpi-dashboard"
              className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm hover:bg-blue-100"
            >
              <p className="font-medium text-blue-900">CPI Dashboard</p>
              <p className="mt-1 text-blue-800">Analyse state-wise inflation trends</p>
            </a>
            <a
              href="/compare"
              className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm hover:bg-blue-100"
            >
              <p className="font-medium text-blue-900">CPI vs WPI Comparison</p>
              <p className="mt-1 text-blue-800">Compare consumer and wholesale price indices</p>
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
