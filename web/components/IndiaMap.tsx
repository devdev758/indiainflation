import React, { useMemo, useState } from "react";
import { getInflationColor, StatewiseStats } from "@/lib/mapUtils";
import { getStateRegion, allIndianStates } from "@/lib/stateGeoData";

interface StatewiseMapData {
  state: string;
  cpi_value: number;
  yoy_percent: number;
}

interface IndiaMapProps {
  data: StatewiseMapData[];
  stats?: StatewiseStats;
  onStateHover?: (state: StatewiseMapData | null) => void;
  onStateClick?: (state: StatewiseMapData) => void;
  showRegions?: boolean;
  height?: number;
}

/**
 * Group states by geographic region for better organization
 */
function groupStatesByRegion(
  data: StatewiseMapData[]
): Record<string, StatewiseMapData[]> {
  const grouped: Record<string, StatewiseMapData[]> = {
    North: [],
    South: [],
    East: [],
    West: [],
    Northeast: [],
    Central: [],
    "Union Territories": [],
  };

  data.forEach((state) => {
    const region = getStateRegion(state.state);
    if (region === "Other") {
      grouped["Union Territories"].push(state);
    } else {
      grouped[region]?.push(state);
    }
  });

  return grouped;
}

/**
 * Regional display order for better UX
 */
const regionOrder = ["North", "Northeast", "Central", "East", "West", "South", "Union Territories"];

/**
 * IndiaMap Component
 * Displays state-wise inflation data with color-coded visualization
 */
export function IndiaMap({
  data,
  stats,
  onStateHover,
  onStateClick,
  showRegions = true,
  height = 600,
}: IndiaMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Group states by region
  const groupedStates = useMemo(() => {
    const grouped = groupStatesByRegion(data);
    const ordered: Record<string, StatewiseMapData[]> = {};
    regionOrder.forEach((region) => {
      if (grouped[region] && grouped[region].length > 0) {
        ordered[region] = grouped[region].sort((a, b) =>
          a.state.localeCompare(b.state)
        );
      }
    });
    return ordered;
  }, [data]);

  const handleStateMouseEnter = (state: StatewiseMapData) => {
    setHoveredState(state.state);
    onStateHover?.(state);
  };

  const handleStateMouseLeave = () => {
    setHoveredState(null);
    onStateHover?.(null);
  };

  return (
    <div className="space-y-6" style={{ minHeight: height }}>
      {/* Legend */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-3 font-semibold text-slate-900">Inflation Scale (YoY %)</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-green-600" />
            <span className="text-xs text-slate-600">Deflation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-emerald-400" />
            <span className="text-xs text-slate-600">Very Low (0-2%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-amber-400" />
            <span className="text-xs text-slate-600">Moderate (2-4%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-orange-500" />
            <span className="text-xs text-slate-600">Elevated (4-6%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-500" />
            <span className="text-xs text-slate-600">High (6-8%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-red-700" />
            <span className="text-xs text-slate-600">Very High (&gt;8%)</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-600">Highest</p>
            <p className="mt-1 font-semibold text-red-600">{stats.highest.state}</p>
            <p className="text-sm text-slate-700">{stats.highest.yoy_percent.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-600">Lowest</p>
            <p className="mt-1 font-semibold text-green-600">{stats.lowest.state}</p>
            <p className="text-sm text-slate-700">{stats.lowest.yoy_percent.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-600">Average</p>
            <p className="mt-1 font-semibold text-slate-900">India</p>
            <p className="text-sm text-slate-700">{stats.average.toFixed(2)}%</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-600">Median</p>
            <p className="mt-1 font-semibold text-slate-900">Range</p>
            <p className="text-sm text-slate-700">
              {stats.min.toFixed(2)}% – {stats.max.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Map Grid by Region */}
      <div className="space-y-6">
        {Object.entries(groupedStates).map(([region, states]) => (
          <div key={region} className="space-y-2">
            <h3 className="font-semibold text-slate-900">{region}</h3>
            <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-4">
              {states.map((state) => (
                <button
                  key={state.state}
                  onMouseEnter={() => handleStateMouseEnter(state)}
                  onMouseLeave={handleStateMouseLeave}
                  onClick={() => onStateClick?.(state)}
                  className="group rounded-lg border-2 p-3 transition text-left"
                  style={{
                    backgroundColor: getInflationColor(state.yoy_percent),
                    borderColor: hoveredState === state.state ? "#1E40AF" : "transparent",
                    opacity: hoveredState === null || hoveredState === state.state ? 1 : 0.6,
                  }}
                  title={`${state.state}: ${state.yoy_percent.toFixed(2)}%`}
                >
                  <p className="text-sm font-semibold text-white drop-shadow">{state.state}</p>
                  <p className="text-xs text-white drop-shadow opacity-90">
                    {state.yoy_percent.toFixed(2)}%
                  </p>
                  <p className="text-xs text-white drop-shadow opacity-75">
                    CPI: {state.cpi_value.toFixed(1)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-900">State</th>
              <th className="px-4 py-2 text-left font-semibold text-slate-900">Region</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-900">CPI Value</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-900">YoY %</th>
            </tr>
          </thead>
          <tbody>
            {[...data]
              .sort((a, b) => b.yoy_percent - a.yoy_percent)
              .map((state, idx) => (
                <tr
                  key={state.state}
                  className="border-b border-slate-200 hover:bg-slate-50 transition"
                  onMouseEnter={() => handleStateMouseEnter(state)}
                  onMouseLeave={handleStateMouseLeave}
                  style={{
                    backgroundColor: hoveredState === state.state ? "#F8FAFC" : undefined,
                  }}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{state.state}</td>
                  <td className="px-4 py-3 text-slate-600">{getStateRegion(state.state)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {state.cpi_value.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">
                    <span
                      className="inline-block rounded px-2 py-1 text-white"
                      style={{ backgroundColor: getInflationColor(state.yoy_percent) }}
                    >
                      {state.yoy_percent.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Simple card-based state visualization
 * Useful for mobile or compact displays
 */
export function StateGridCard({ data }: { data: StatewiseMapData }) {
  return (
    <div
      className="rounded-lg p-4 text-white shadow-md hover:shadow-lg transition"
      style={{ backgroundColor: getInflationColor(data.yoy_percent) }}
    >
      <p className="font-semibold">{data.state}</p>
      <p className="text-sm opacity-90">CPI: {data.cpi_value.toFixed(1)}</p>
      <p className="text-lg font-bold">{data.yoy_percent.toFixed(2)}%</p>
    </div>
  );
}
