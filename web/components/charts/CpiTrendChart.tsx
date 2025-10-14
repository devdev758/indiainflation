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
};

function formatMonthLabel(value: string): string {
  try {
    const parsed = new Date(value);
    return new Intl.DateTimeFormat("en", { month: "short", year: "2-digit" }).format(parsed);
  } catch (error) {
    return value;
  }
}

export function CpiTrendChart({ data, series }: CpiTrendChartProps): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>CPI Trend</CardTitle>
        <CardDescription>Indexed inflation values for select household essentials.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="date" tickFormatter={formatMonthLabel} stroke="#64748B" fontSize={12} tickMargin={8} />
            <YAxis stroke="#64748B" fontSize={12} tickFormatter={(value) => `${value}`} />
            <Tooltip
              contentStyle={{ backgroundColor: "white", borderRadius: 12, borderColor: "#E2E8F0" }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)}`, name]}
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
      </CardContent>
    </Card>
  );
}
