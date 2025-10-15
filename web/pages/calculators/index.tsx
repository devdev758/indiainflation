import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import type { ReactElement } from "react";

import InflationConverter from "@/components/InflationConverter";
import { CpiComparisonTool } from "@/components/calculators/CpiComparisonTool";
import { CpiWpiDifferential } from "@/components/calculators/CpiWpiDifferential";
import { StateComparisonChart } from "@/components/calculators/StateComparisonChart";
import { YoYCalculator } from "@/components/calculators/YoYCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPARISON_SLUGS } from "@/lib/data/catalog";
import { loadPhase3Items, type Phase3ItemDataset } from "@/lib/data/phase3";
import { collectRegionOptions } from "@/lib/data/phase3Shared";

type CalculatorsPageProps = {
  generatedAt: string;
  items: Phase3ItemDataset[];
  regions: Array<{ code: string; name: string; type: string }>;
};

export const getStaticProps: GetStaticProps<CalculatorsPageProps> = async () => {
  const items = await loadPhase3Items(COMPARISON_SLUGS);
  const regions = collectRegionOptions(items);

  return {
    props: {
      generatedAt: new Date().toISOString(),
      items,
      regions
    },
    revalidate: 300
  };
};

export default function CalculatorsIndex({ items, regions, generatedAt }: InferGetStaticPropsType<typeof getStaticProps>): ReactElement {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/calculators`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    headline: "Indiainflation Calculators",
    url: canonicalUrl,
    dateModified: generatedAt,
    hasPart: [
      {
        "@type": "WebApplication",
        name: "Inflation Converter",
        url: canonicalUrl
      },
      {
        "@type": "WebApplication",
        name: "YoY Inflation Calculator",
        url: canonicalUrl
      },
      {
        "@type": "WebApplication",
        name: "CPI Comparison Tool",
        url: canonicalUrl
      },
      {
        "@type": "WebApplication",
        name: "CPI vs WPI Differential",
        url: canonicalUrl
      },
      {
        "@type": "WebApplication",
        name: "State-wise CPI Comparison",
        url: canonicalUrl
      }
    ]
  };
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>Inflation Calculators & CPI Tools | Indiainflation</title>
        <meta
          name="description"
          content="Convert historical rupee amounts, compute YoY inflation, and compare CPI item trends with Indiainflation’s interactive calculators."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <section className="rounded-3xl bg-blue-600 px-8 py-12 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Calculators</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">CPI tools for households & analysts</h1>
            <p className="max-w-3xl text-sm text-blue-100">
              Run quick inflation adjustments, benchmark household expenses, and visualise price movement across India’s CPI basket.
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
            <Link href="/contact">Request a custom calculator</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inflation converter</CardTitle>
            <CardDescription>
              Adjust rupee amounts across years using India’s official CPI index. Ideal for budgeting, salary negotiations, and research.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InflationConverter />
          </CardContent>
        </Card>

        <YoYCalculator />
      </section>

      <section className="mt-12">
        <CpiComparisonTool datasets={items} regions={regions} />
      </section>

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <CpiWpiDifferential />
        <StateComparisonChart />
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Need more datasets?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              Our ETL system exports CPI series across categories, states, and rural/urban splits. Reach out to integrate custom datasets into your dashboards.
            </p>
            <Button asChild>
              <Link href="mailto:hello@indiainflation.in">Email the data team</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Explore CPI item pages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <Link className="block rounded-xl border border-slate-200 p-3 transition hover:border-blue-200" href="/items/cpi-all-items">
              Headline CPI explorer
            </Link>
            <Link className="block rounded-xl border border-slate-200 p-3 transition hover:border-blue-200" href="/items/cpi-food-and-beverages">
              Food CPI explorer
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
