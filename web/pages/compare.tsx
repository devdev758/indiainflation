import Head from "next/head";
import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

import { useCompare } from "@/hooks/useInflationData";

const CPI_SECTOR_OPTIONS = ["Combined", "Urban", "Rural"];
const CPI_GROUP_OPTIONS = ["All Items", "Food & Beverages", "Fuel & Light", "Housing", "Clothing", "Health", "Education", "Recreation", "Communication", "Other"];
const WPI_CATEGORY_OPTIONS = ["All Commodities", "Primary Articles", "Fuel & Power", "Manufactured Products"];

function formatMonth(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function downloadJson(data: any, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadCsv(data: any[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? "")).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function ComparePage() {
  const [compareSector, setCompareSector] = useState("Combined");
  const [compareCpiGroup, setCompareCpiGroup] = useState("All Items");
  const [compareWpiCategory, setCompareWpiCategory] = useState("All Commodities");
  const [compareMonths, setCompareMonths] = useState(24);

  const { data: compareData, isLoading: compareLoading, error: compareError } = useCompare(
    compareSector,
    compareCpiGroup,
    compareWpiCategory,
    compareMonths
  );

  const chartData = useMemo(() => {
    if (!compareData) return [];
    return compareData.map((entry) => ({
      date: formatMonth(entry.observation_month),
      "CPI Index": entry.dataset === "CPI" ? entry.index_value : undefined,
      "WPI Index": entry.dataset === "WPI" ? entry.index_value : undefined,
      "CPI YoY": entry.dataset === "CPI" ? entry.yoy_inflation_rate : undefined,
      "WPI YoY": entry.dataset === "WPI" ? entry.yoy_inflation_rate : undefined
    }));
  }, [compareData]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/compare`;

  return (
    <>
      <Head>
        <title>Compare CPI vs WPI | Indiainflation</title>
        <meta
          name="description"
          content="Interactive tool to compare consumer price index (CPI) with wholesale price index (WPI) trends and inflation rates."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-10 md:px-6">
        <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-8 text-white shadow-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Comparison Tool</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Compare CPI vs WPI</h1>
            <p className="max-w-3xl text-sm text-blue-100">
              Analyse the divergence between consumer and wholesale prices. Compare headline indices, YoY inflation rates, and export data for
              deeper analysis.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Select Parameters</h2>

          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">CPI Sector</label>
              <select
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={compareSector}
                onChange={(e) => setCompareSector(e.target.value)}
              >
                {CPI_SECTOR_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">CPI Group</label>
              <select
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={compareCpiGroup}
                onChange={(e) => setCompareCpiGroup(e.target.value)}
              >
                {CPI_GROUP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">WPI Category</label>
              <select
                className="w-full rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={compareWpiCategory}
                onChange={(e) => setCompareWpiCategory(e.target.value)}
              >
                {WPI_CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Months</label>
              <input
                type="number"
                min={3}
                max={120}
                className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={compareMonths}
                onChange={(e) => setCompareMonths(Number(e.target.value))}
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Index & Inflation Comparison</h2>
              <p className="text-sm text-slate-500">
                {compareCpiGroup} (CPI) vs {compareWpiCategory} (WPI)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => downloadCsv(compareData ?? [], `cpi-wpi-comparison-${compareSector}.csv`)}
                disabled={!compareData || compareData.length === 0}
                className="rounded-full border border-green-500 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download CSV
              </button>
              <button
                onClick={() => downloadJson(compareData ?? [], `cpi-wpi-comparison-${compareSector}.json`)}
                disabled={!compareData || compareData.length === 0}
                className="rounded-full border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download JSON
              </button>
            </div>
          </div>

          {compareError && <p className="mt-4 text-sm text-red-600">Failed to load comparison data. Please check your selection.</p>}

          <div className="mt-6 h-96 w-full">
            {compareLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading comparison data…</div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis yAxisId="left" label={{ value: "Index", angle: -90, position: "insideLeft" }} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: "YoY %", angle: 90, position: "insideRight" }} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="CPI Index" stroke="#2563eb" strokeWidth={2} dot={false} connectNulls name="CPI Index" />
                  <Line yAxisId="left" type="monotone" dataKey="WPI Index" stroke="#f97316" strokeWidth={2} dot={false} connectNulls name="WPI Index" />
                  <Line yAxisId="right" type="monotone" dataKey="CPI YoY" stroke="#22c55e" strokeWidth={1.5} dot={false} connectNulls name="CPI YoY %" />
                  <Line yAxisId="right" type="monotone" dataKey="WPI YoY" stroke="#dc2626" strokeWidth={1.5} dot={false} connectNulls name="WPI YoY %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No comparison data available for selected parameters.</div>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Understanding CPI vs WPI</h2>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-600">
              <li>
                <strong>CPI</strong> measures consumer prices at retail; reflects inflation faced by households.
              </li>
              <li>
                <strong>WPI</strong> measures wholesale prices; often leads CPI changes by 2-3 months.
              </li>
              <li>Divergence between CPI and WPI suggests supply chain pressures or margin adjustments.</li>
              <li>Use this tool to anticipate retail inflation changes from wholesale signals.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Export Options</h2>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-600">
              <li>Download CSV for import into Excel, Google Sheets, or Python/R analysis.</li>
              <li>Download JSON for programmatic use in dashboards, models, or integrations.</li>
              <li>All data is point-in-time and includes both index values and YoY inflation rates.</li>
              <li>Customize sector, group, and time range before exporting.</li>
            </ul>
          </div>
        </section>
      </div>
    </>
  );
}
