import Head from "next/head";
import { useMemo, useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

import { useStatewise, useGroups } from "@/hooks/useInflationData";

function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value == null || Number.isNaN(value)) return "--";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

function formatMonth(value: string): string {
  const date = new Date(value);
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
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

const SECTOR_OPTIONS = ["Combined", "Urban", "Rural"];

export default function CpiDashboardPage() {
  const [selectedSector, setSelectedSector] = useState("Combined");

  const { data: statewiseData, isLoading: statewiseLoading, error: statewiseError } = useStatewise();
  const { data: groupsData, isLoading: groupsLoading, error: groupsError } = useGroups(selectedSector);

  const latestMonth = useMemo(() => {
    if (!statewiseData || statewiseData.length === 0) return null;
    return statewiseData[0].observation_month;
  }, [statewiseData]);

  const stateTable = useMemo(() => {
    if (!statewiseData) return [];
    const filtered = statewiseData.filter((entry) => entry.sector === selectedSector && entry.observation_month === latestMonth);
    return filtered.sort((a, b) => a.state.localeCompare(b.state));
  }, [statewiseData, selectedSector, latestMonth]);

  const groupsChart = useMemo(() => {
    if (!groupsData) return [];
    return groupsData.sort((a, b) => b.index_value - a.index_value);
  }, [groupsData]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/cpi-dashboard`;

  return (
    <>
      <Head>
        <title>India CPI Dashboard | Indiainflation</title>
        <meta
          name="description"
          content="Interactive CPI dashboard with state-wise inflation rates, group-wise analysis, and downloadable datasets."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
      </Head>

      <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 pt-10 md:px-6">
        <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-8 text-white shadow-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Dashboard</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">India CPI Dashboard</h1>
            <p className="max-w-3xl text-sm text-blue-100">
              Explore state-wise consumer price indices, analyse major CPI groups, and download datasets for deeper analysis.
            </p>
          </div>
          {latestMonth && (
            <p className="mt-6 text-xs uppercase tracking-[0.3em] text-blue-100">Latest data: {formatMonth(latestMonth)}</p>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">State-wise CPI</h2>
              <p className="text-sm text-slate-500">Latest consumer price indices by state/UT</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-600">Sector:</label>
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {SECTOR_OPTIONS.map((sector) => (
                    <option key={sector} value={sector}>
                      {sector}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => downloadCsv(stateTable, `statewise-cpi-${selectedSector.toLowerCase()}.csv`)}
                disabled={stateTable.length === 0}
                className="rounded-full border border-blue-500 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download CSV
              </button>
            </div>
          </div>

          {statewiseError && <p className="mt-4 text-sm text-red-600">Failed to load statewise data.</p>}

          <div className="mt-6 overflow-x-auto">
            {statewiseLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading state-wise data…</div>
            ) : stateTable.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">State/UT</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Major Group</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Index Value</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">YoY Inflation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stateTable.map((entry, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-900">{entry.state}</td>
                      <td className="px-4 py-3 text-slate-600">{entry.major_group || "All Items"}</td>
                      <td className="px-4 py-3 text-right text-slate-900">{entry.index_value.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatPercent(entry.inflation_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">No data available for selected sector.</div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">CPI Major Groups</h2>
            <p className="text-sm text-slate-500">Group-wise index values and YoY inflation rates ({selectedSector})</p>
          </div>

          {groupsError && <p className="mt-4 text-sm text-red-600">Failed to load groups data.</p>}

          <div className="mt-6 h-80 w-full">
            {groupsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading groups data…</div>
            ) : groupsChart.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={groupsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="major_group" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#64748b", fontSize: 12 }} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar yAxisId="left" dataKey="index_value" fill="#3b82f6" name="Index Value" />
                  <Bar yAxisId="right" dataKey="yoy_inflation_rate" fill="#22c55e" name="YoY Inflation %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No groups data available.</div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm text-sm text-slate-600">
          <h2 className="text-xl font-semibold text-slate-900">Usage Guide</h2>
          <ul className="mt-3 list-disc space-y-2 pl-4">
            <li>Select different sectors (Combined, Urban, Rural) to compare regional inflation patterns.</li>
            <li>Download CSV files for offline analysis and modelling.</li>
            <li>Use the CPI groups chart to identify which categories drive headline inflation.</li>
          </ul>
        </section>
      </div>
    </>
  );
}
