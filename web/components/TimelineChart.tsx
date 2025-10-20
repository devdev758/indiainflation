import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from "recharts";
import { TimelineDataPoint } from "@/hooks/useTimelineData";
import { TimelineAnnotation } from "@/lib/annotations";

interface TimelineChartProps {
  data: TimelineDataPoint[];
  annotations?: TimelineAnnotation[];
  height?: number;
  showYoY?: boolean;
  showAnnotations?: boolean;
  dataType?: "cpi" | "wpi";
  sector?: string;
  onHover?: (point: TimelineDataPoint | null) => void;
}

export function TimelineChart({
  data,
  annotations = [],
  height = 400,
  showYoY = true,
  showAnnotations = true,
  dataType = "cpi",
  sector = "combined",
  onHover,
}: TimelineChartProps) {
  // Prepare data with formatted dates
  const chartData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        displayDate: new Date(point.date).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
        }),
      })),
    [data]
  );

  // Get value range for secondary axis
  const yoyRange = useMemo(() => {
    if (!showYoY || data.length === 0) return { min: -5, max: 15 };
    const yoyValues = data.filter((p) => p.yoy_percent !== undefined).map((p) => p.yoy_percent!);
    if (yoyValues.length === 0) return { min: -5, max: 15 };
    return {
      min: Math.floor(Math.min(...yoyValues) - 1),
      max: Math.ceil(Math.max(...yoyValues) + 1),
    };
  }, [data, showYoY]);

  // Reference lines for annotations
  const referenceLines = useMemo(() => {
    if (!showAnnotations) return [];

    return annotations
      .filter((ann) => ann.year >= (data[0]?.year || 1958) && ann.year <= (data[data.length - 1]?.year || 2024))
      .map((ann) => ({
        annotation: ann,
        x: ann.year,
      }));
  }, [annotations, data, showAnnotations]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;

    const point = chartData[label];
    if (!point) return null;

    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-sm font-semibold text-slate-900">{point.displayDate}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-xs">
            {entry.name}: {entry.value.toFixed(2)}
            {entry.name.includes("YoY") ? "%" : ""}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          onMouseMove={(state) => {
            if (state.isTooltipActive && state.activeTooltipIndex !== undefined) {
              onHover?.(data[state.activeTooltipIndex]);
            }
          }}
          onMouseLeave={() => onHover?.(null)}
        >
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />

          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12 }}
            stroke="#94A3B8"
            interval={Math.floor(data.length / 12)} // Show ~12 labels
          />

          {/* Primary Y-axis: Index Value */}
          <YAxis
            yAxisId="left"
            label={{ value: `${dataType.toUpperCase()} Index`, angle: -90, position: "insideLeft" }}
            tick={{ fontSize: 12 }}
            stroke="#3B82F6"
            domain={["dataMin - 10", "dataMax + 10"]}
          />

          {/* Secondary Y-axis: YoY % */}
          {showYoY && (
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: "YoY Inflation %", angle: 90, position: "insideRight" }}
              tick={{ fontSize: 12 }}
              stroke="#F97316"
              domain={[yoyRange.min, yoyRange.max]}
            />
          )}

          <Tooltip content={<CustomTooltip />} />

          <Legend
            wrapperStyle={{ paddingTop: "20px" }}
            iconType="line"
          />

          {/* Index Value Line */}
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="value"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name={`${dataType.toUpperCase()} Index`}
            connectNulls
          />

          {/* YoY Inflation Line */}
          {showYoY && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="yoy_percent"
              stroke="#F97316"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              name="YoY Inflation %"
              strokeDasharray="5 5"
              connectNulls
            />
          )}

          {/* Annotation Reference Lines */}
          {referenceLines.map((ref, idx) => (
            <ReferenceLine
              key={idx}
              x={ref.x}
              stroke={ref.annotation.color}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
              label={{
                value: ref.annotation.label,
                position: "top",
                fontSize: 11,
                fill: ref.annotation.color,
                offset: 10,
              }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Annotations Legend */}
      {showAnnotations && referenceLines.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Key Events</h3>
          <div className="grid gap-2 md:grid-cols-2">
            {referenceLines.map((ref, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs">
                <div
                  className="mt-1.5 h-2 w-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: ref.annotation.color }}
                />
                <div>
                  <p className="font-semibold text-slate-900">{ref.annotation.label}</p>
                  {ref.annotation.description && (
                    <p className="text-slate-600">{ref.annotation.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Summary */}
      {data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-600">Start</p>
            <p className="font-semibold text-slate-900">
              {data[0].date} ({data[0].value.toFixed(2)})
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-600">End</p>
            <p className="font-semibold text-slate-900">
              {data[data.length - 1].date} ({data[data.length - 1].value.toFixed(2)})
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-600">Change</p>
            <p className={`font-semibold ${data[data.length - 1].value >= data[0].value ? "text-red-600" : "text-green-600"}`}>
              {((data[data.length - 1].value - data[0].value) / data[0].value * 100).toFixed(2)}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs text-slate-600">Avg YoY %</p>
            <p className="font-semibold text-slate-900">
              {(
                data.filter((p) => p.yoy_percent !== undefined).reduce((sum, p) => sum + (p.yoy_percent || 0), 0) /
                data.filter((p) => p.yoy_percent !== undefined).length
              ).toFixed(2)}
              %
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
