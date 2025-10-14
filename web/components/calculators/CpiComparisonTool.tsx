'use client';

import { useMemo, useState, type ReactElement } from "react";
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
import { cn } from "@/lib/utils";
import { useItemExports } from "@/lib/client/useItemExports";

const ITEMS = [
  { label: "Milk", value: "milk", color: "#2563eb" },
  { label: "Rice", value: "rice", color: "#f97316" }
];

const ITEM_SLUGS = ITEMS.map((item) => item.value);

type SeriesRow = {
  date: string;
  [key: string]: number | string | null;
};

function normaliseValue(entry: { index?: number; index_value?: number; value?: number }): number | null {
  const candidate = entry.index_value ?? entry.index ?? entry.value;
  return typeof candidate === "number" ? candidate : null;
}

function formatMonthLabel(value: string): string {
  try {
    const parsed = new Date(`${value}-01`);
    return new Intl.DateTimeFormat("en", { month: "short" }).format(parsed);
  } catch (error) {
    return value;
  }
}

export function CpiComparisonTool(): ReactElement {
  const [selectedItems, setSelectedItems] = useState<string[]>(ITEMS.map((item) => item.value));
  const { data, loading, error } = useItemExports(ITEM_SLUGS);

  const chartData: SeriesRow[] = useMemo(() => {
    const map = new Map<string, SeriesRow>();

    ITEMS.forEach(({ value }) => {
      const exportData = data[value];
      if (!exportData?.series) return;

      exportData.series.forEach((entry) => {
        const row = map.get(entry.date) ?? { date: entry.date };
        row[value] = normaliseValue(entry) ?? null;
        map.set(entry.date, row);
      });
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(`${a.date}-01`).getTime() - new Date(`${b.date}-01`).getTime())
      .slice(-18);
  }, [data]);

  function toggleItem(value: string) {
    setSelectedItems((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CPI comparison</CardTitle>
        <CardDescription>Compare indexed CPI values across essential household items.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {ITEMS.map((item) => (
            <label
              key={item.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                selectedItems.includes(item.value)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              )}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={selectedItems.includes(item.value)}
                onChange={() => toggleItem(item.value)}
              />
              <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="h-80 rounded-2xl border border-slate-200 bg-white/70 p-2">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading comparison…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="date" tickFormatter={formatMonthLabel} stroke="#94A3B8" fontSize={12} tickMargin={8} />
                <YAxis stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "white", borderRadius: 12, borderColor: "#E2E8F0" }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}`, ITEMS.find((item) => item.value === name)?.label ?? name]}
                  labelFormatter={(label) => new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${label}-01`))}
                />
                <Legend />
                {ITEMS.filter((item) => selectedItems.includes(item.value)).map((item) => (
                  <Line
                    key={item.value}
                    type="monotone"
                    dataKey={item.value}
                    name={item.label}
                    stroke={item.color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
