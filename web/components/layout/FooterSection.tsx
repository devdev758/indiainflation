import type { ReactElement, ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Insight = {
  title: string;
  description: string;
  bullets: string[];
  extra?: ReactNode;
};

const INSIGHTS: Insight[] = [
  {
    title: "About inflation in India",
    description:
      "The Consumer Price Index (CPI) measures how the average cost of goods and services evolves for households across India’s states and sectors.",
    bullets: [
      "Rural and urban price surveys are combined into the headline CPI published monthly by MOSPI.",
      "Food, fuel, and core indices provide the Reserve Bank of India with policy signals.",
      "Household budgeting, salary negotiations, and investment strategies rely on trusted CPI data."
    ]
  },
  {
    title: "Data sources",
    description:
      "Indiainflation’s ETL pipelines blend official releases with high-frequency market feeds to power calculators, articles, and dashboards.",
    bullets: [
      "Ministry of Statistics and Programme Implementation annexes and press notes.",
      "Reserve Bank of India bulletins covering inflation expectations.",
      "Typesense-backed CPI search for instant item and region lookups."
    ]
  }
];

export function FooterSection(): ReactElement {
  return (
    <section className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        {INSIGHTS.map((insight) => (
          <Card key={insight.title} className="border-slate-200 bg-white/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-900">{insight.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>{insight.description}</p>
              <ul className="space-y-2">
                {insight.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="mt-1 text-blue-500">•</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              {insight.extra}
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Stay ahead of price movements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-blue-50">
          <p>Subscribe for monthly CPI briefings, downloadable datasets, and alerts designed for policymakers, founders, and analysts.</p>
          <form className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              placeholder="your.name@workmail.com"
              className="h-12 flex-1 rounded-full border border-white/50 bg-white/10 px-5 text-sm text-white placeholder:text-blue-100 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/80"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-full bg-white/90 px-6 text-sm font-semibold text-blue-700 transition hover:bg-white"
            >
              Get CPI alerts
            </button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
