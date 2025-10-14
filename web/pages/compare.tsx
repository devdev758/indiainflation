import Head from "next/head";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import { CpiComparisonTool } from "@/components/calculators/CpiComparisonTool";
import { YoYCalculator } from "@/components/calculators/YoYCalculator";

type ComparePageProps = {
  generatedAt: string;
};

export const getStaticProps: GetStaticProps<ComparePageProps> = async () => {
  return {
    props: {
      generatedAt: new Date().toISOString()
    },
    revalidate: 300
  };
};

export default function ComparePage({ generatedAt }: InferGetStaticPropsType<typeof getStaticProps>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/compare`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "India CPI Comparison Tool",
    url: canonicalUrl,
    applicationCategory: "FinanceApplication",
    dateModified: generatedAt
  };

  return (
    <div className="mx-auto max-w-5xl space-y-12 px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>Compare India CPI Items & Inflation Trends</title>
        <meta
          name="description"
          content="Overlay CPI series, calculate YoY inflation, and benchmark items instantly with Indiainflation’s comparison tools."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <section className="space-y-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-500">Compare</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">Compare CPI items in seconds</h1>
        <p className="mx-auto max-w-3xl text-sm text-slate-600">
          Select up to five CPI items, normalise the data, and quantify spreads for analysts, founders, and policy observers tracking inflation divergence.
        </p>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
        <CpiComparisonTool />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm text-left text-sm text-slate-600">
          <h2 className="text-xl font-semibold text-slate-900">Workflow tips</h2>
          <ul className="mt-3 list-disc space-y-2 pl-4">
            <li>Use the normalise toggle to index all series to the same starting point.</li>
            <li>Export comparison data for offline analysis or sharing with stakeholders.</li>
            <li>Combine results with the YoY calculator for headline summaries.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">YoY snapshot</h2>
          <YoYCalculator />
        </div>
      </section>
    </div>
  );
}
