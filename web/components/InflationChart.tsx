import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import type { CPIDataPoint } from "@/lib/inflationCalculator";

interface InflationChartProps {
  data: CPIDataPoint[];
  fromDate?: string;
  toDate?: string;
  showPercentChange?: boolean;
  height?: number;
}

export function InflationChart({
  data,
  fromDate,
  toDate,
  showPercentChange = false,
  height = 350
}: InflationChartProps) {
  // Transform data for chart
  const chartData = useMemo(() => {
    return data.map((point, index) => {
      const cpiValue = point.cpiValue;
      
      // Calculate month-on-month percentage change
      let percentChange = null;
      if (index > 0) {
        const prevValue = data[index - 1].cpiValue;
        percentChange = ((cpiValue - prevValue) / prevValue) * 100;
      }

      // Format date for display (YYYY-MM → Jan 2024, etc.)
      const date = new Date(point.date + "-01");
      const monthYear = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });

      return {
        date: point.date,
        monthYear,
        cpiValue: Math.round(cpiValue * 100) / 100,
        percentChange: percentChange ? Math.round(percentChange * 1000) / 1000 : null
      };
    });
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center">
        <p className="text-sm text-slate-500">No data available for the selected date range</p>
      </div>
    );
  }

  if (chartData.length === 1) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center">
        <p className="text-sm text-slate-500">Select a longer date range to display the chart</p>
      </div>
    );
  }

  // Determine if we should show percent change
  const hasPercentData = showPercentChange && chartData.some((d) => d.percentChange !== null);

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">CPI Trend</h3>
        <p className="text-sm text-slate-600">
          {fromDate && toDate
            ? `${formatDateDisplay(fromDate)} to ${formatDateDisplay(toDate)}`
            : "Historical CPI Index"}
        </p>
      </div>

      <div className="w-full overflow-x-auto">
        {hasPercentData ? (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
              <defs>
                <linearGradient id="colorCpi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="monthYear"
                tick={{ fontSize: 12, fill: "#64748b" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#64748b" }} label={{ value: "CPI Index", angle: -90, position: "insideLeft" }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12, fill: "#64748b" }}
                label={{ value: "MoM Change %", angle: 90, position: "insideRight" }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: 12 }}
                formatter={(value, name) => {
                  if (name === "cpiValue") {
                    return [value, "CPI Index"];
                  }
                  if (name === "percentChange") {
                    return [`${value}%`, "MoM Change"];
                  }
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cpiValue"
                fill="url(#colorCpi)"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="CPI Index"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="percentChange"
                stroke="#22c55e"
                strokeWidth={1.5}
                dot={false}
                name="MoM Change %"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="monthYear"
                tick={{ fontSize: 12, fill: "#64748b" }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: 12 }}
                formatter={(value) => {
                  if (typeof value === "number") {
                    return [value.toFixed(2), "CPI Index"];
                  }
                  return [value, ""];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="cpiValue"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={false}
                name="CPI Index"
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-600">First CPI</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{chartData[0]?.cpiValue.toFixed(2)}</p>
          <p className="text-xs text-slate-500">{chartData[0]?.monthYear}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-600">Last CPI</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{chartData[chartData.length - 1]?.cpiValue.toFixed(2)}</p>
          <p className="text-xs text-slate-500">{chartData[chartData.length - 1]?.monthYear}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-600">Total Change</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {(
              ((chartData[chartData.length - 1]?.cpiValue - chartData[0]?.cpiValue) / chartData[0]?.cpiValue) *
              100
            ).toFixed(2)}
            %
          </p>
          <p className="text-xs text-slate-500">{chartData.length} months</p>
        </div>
      </div>
    </div>
  );
}

// Helper function to format date for display
function formatDateDisplay(dateStr: string): string {
  try {
    const date = new Date(dateStr + "-01");
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}
