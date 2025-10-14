'use client';

import { useMemo, useState, type ReactElement } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useItemExports } from "@/lib/client/useItemExports";

type ItemOption = {
  label: string;
  value: string;
};

const ITEM_OPTIONS: ItemOption[] = [
  { label: "Milk", value: "milk" },
  { label: "Rice", value: "rice" }
];

type SeriesEntry = { date: string; index?: number; index_value?: number; value?: number };

function normaliseValue(entry: SeriesEntry): number | null {
  const candidate = entry.index_value ?? entry.index ?? entry.value;
  return typeof candidate === "number" ? candidate : null;
}

function computeYoY(series: SeriesEntry[], targetDate: string): number | null {
  const index = series.findIndex((entry) => entry.date === targetDate);
  if (index === -1) return null;
  const current = normaliseValue(series[index]);
  const comparisonIndex = series.findIndex((entry) => entry.date === subtractMonths(targetDate, 12));
  if (comparisonIndex === -1) return null;
  const previous = normaliseValue(series[comparisonIndex]);
  if (current === null || previous === null || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

function subtractMonths(isoMonth: string, months: number): string {
  const [year, month] = isoMonth.split("-").map((part) => Number(part));
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() - months);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

export function YoYCalculator(): ReactElement {
  const [item, setItem] = useState<string>(ITEM_OPTIONS[0]?.value ?? "milk");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const slugList = useMemo(() => [item], [item]);
  const { data, loading, error } = useItemExports(slugList);
  const series = useMemo(() => data[item]?.series ?? [], [data, item]);

  const monthOptions = useMemo(() => {
    if (!series.length) return [] as string[];
    return series
      .map((entry) => entry.date)
      .filter((date): date is string => typeof date === "string")
      .slice(-36)
      .reverse();
  }, [series]);

  const result = useMemo(() => {
    if (!selectedMonth) return null;
    return computeYoY(series, selectedMonth);
  }, [series, selectedMonth]);

  const formatter = new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "long" });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Year-over-year inflation</CardTitle>
        <CardDescription>Select an item and month to view YoY change against the previous year.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Item</span>
            <select
              className="mt-1 w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={item}
              onChange={(event) => setItem(event.target.value)}
            >
              {ITEM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Month</span>
            <select
              className="mt-1 w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedMonth ?? ""}
              onChange={(event) => setSelectedMonth(event.target.value)}
              disabled={loading || !monthOptions.length}
            >
              <option value="" disabled>
                {loading ? "Loading..." : "Select month"}
              </option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatter.format(new Date(`${month}-01`))}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {result !== null && !Number.isNaN(result) ? (
          <div className="rounded-2xl bg-blue-50/70 p-5 text-blue-900">
            <p className="text-sm font-medium uppercase tracking-wide">YoY change</p>
            <p className="mt-2 text-3xl font-semibold">{result.toFixed(2)}%</p>
            {selectedMonth && (
              <p className="mt-1 text-xs text-blue-700">
                Compared to {formatter.format(new Date(`${subtractMonths(selectedMonth, 12)}-01`))}
              </p>
            )}
          </div>
        ) : (
          !loading && (
            <p className="text-sm text-slate-500">Select a month to compute the year-over-year change.</p>
          )
        )}
      </CardContent>
    </Card>
  );
}
