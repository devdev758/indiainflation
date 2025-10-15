'use client';

import type { ReactElement } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFormatDate } from "@/lib/utils/date";

type SeriesConfig = {
  key: string;
  label: string;
  color: string;
};

export type CpiTrendPoint = {
  date: string;
  [key: string]: string | number | null;
};

type CpiTrendChartProps = {
  data: CpiTrendPoint[];
  series: SeriesConfig[];
  valueFormatter?: (value: number) => string;
  yAxisFormatter?: (value: number) => string;
  title?: string;
  description?: string;
  variant?: "card" | "bare";
  height?: number;
};

function formatMonthLabel(value: string): string {
  const formatted = safeFormatDate(value, { month: "short", year: "2-digit" }, "en");
  return formatted === "—" ? value : formatted;
}

export function CpiTrendChart({
  data,
  series,
  valueFormatter,
  yAxisFormatter,
  title = "CPI Trend",
  description = "Indexed inflation values for select household essentials.",
  variant = "card",
  height = 320
}: CpiTrendChartProps): ReactElement {
  const formatValue = (value: number): string => {
    if (!Number.isFinite(value)) {
      return "--";
    }
    if (valueFormatter) {
      return valueFormatter(value);
    }
    return value.toFixed(1);
  };

  const formatAxis = (value: number): string => {
    if (!Number.isFinite(value)) {
      return "";
    }
    if (yAxisFormatter) {
      return yAxisFormatter(value);
    }
    return value.toString();
  };

  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="date" tickFormatter={formatMonthLabel} stroke="#64748B" fontSize={12} tickMargin={8} />
        <YAxis stroke="#64748B" fontSize={12} tickFormatter={(value) => (typeof value === "number" ? formatAxis(value) : String(value))} />
        <Tooltip
          contentStyle={{ backgroundColor: "white", borderRadius: 12, borderColor: "#E2E8F0" }}
          formatter={(value: number | string, name: string) => {
            const numeric = typeof value === "number" ? value : Number(value);
            return [formatValue(numeric), name];
          }}
          labelFormatter={(label) => formatMonthLabel(label as string)}
        />
        <Legend verticalAlign="top" height={32} />
        {series.map((item) => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.label}
            stroke={item.color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  if (variant === "card") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="h-80" style={{ height }}>
          {chart}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="h-80" style={{ height }}>
      {chart}
    </div>
  );
}
