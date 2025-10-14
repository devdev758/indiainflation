import Head from "next/head";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import InflationConverter from "@/components/InflationConverter";
import LatestCPIWidget from "@/components/LatestCPIWidget";
import { LatestArticlesGrid } from "@/components/articles/LatestArticlesGrid";
import { CpiTrendChart, type CpiTrendPoint } from "@/components/charts/CpiTrendChart";
import { CpiComparisonTool } from "@/components/calculators/CpiComparisonTool";
import { YoYCalculator } from "@/components/calculators/YoYCalculator";
import { FooterSection } from "@/components/layout/FooterSection";
import { HeroSection } from "@/components/layout/HeroSection";
import { ItemExportData, loadItemExport } from "@/lib/exportLoader";
import { fetchPosts, type PostSummary } from "@/lib/wpClient";

type HomeProps = {
  posts: PostSummary[];
  trendData: CpiTrendPoint[];
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const [posts, milkExport, riceExport] = await Promise.all([
      fetchPosts({ per_page: 6, page: 1 }),
      loadItemExportSafe("milk"),
      loadItemExportSafe("rice")
    ]);

    const trendData = buildTrendDataset([
      { key: "milk", label: "Milk CPI", color: "#2563eb", dataset: milkExport },
      { key: "rice", label: "Rice CPI", color: "#10b981", dataset: riceExport }
    ]);

    return {
      props: { posts, trendData },
      revalidate: 300
    };
  } catch (error) {
    console.error("homepage posts fetch failed", error);
    return {
      props: { posts: [], trendData: [] },
      revalidate: 300
    };
  }
};

export default function Home({ posts, trendData }: InferGetStaticPropsType<typeof getStaticProps>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/`;
  const ogImage = `${siteUrl.replace(/\/$/, "")}/api/og?title=${encodeURIComponent("India Inflation Calculator")}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Indiainflation",
    url: siteUrl,
    description:
      "Explore India’s inflation trends, convert historical prices, and read CPI analysis with Indiainflation calculators and dashboards.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/items/{search_term}`,
      "query-input": "required name=search_term"
    }
  };

  return (
    <>
      <Head>
        <title>India Inflation Calculator & CPI Insights | Indiainflation</title>
        <meta
          name="description"
          content="Explore India’s inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Indiainflation" />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="India Inflation Calculator & CPI Insights" />
        <meta
          name="twitter:description"
          content="Explore India’s inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts."
        />
        <meta name="twitter:image" content={ogImage} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 pt-10 md:px-6">
        <HeroSection
          eyebrow="Trusted inflation intelligence for India"
          title="India Inflation Calculator"
          description="Analyse consumer price changes, compare essential items, and translate historic rupee amounts into today’s terms with live CPI data."
          primaryCta={{ href: "/calculators", label: "Explore calculators" }}
          secondaryCta={{ href: "/articles", label: "Read latest articles" }}
          highlight={<LatestCPIWidget />}
          calculator={<InflationConverter />}
        />

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <CpiTrendChart
            data={trendData}
            series={[
              { key: "milk", label: "Milk CPI", color: "#2563eb" },
              { key: "rice", label: "Rice CPI", color: "#10b981" }
            ]}
          />
          <div className="grid gap-6">
            <YoYCalculator />
            <CpiComparisonTool />
          </div>
        </section>

        <LatestArticlesGrid posts={posts} />

        <FooterSection />
      </div>
    </>
  );
}

async function loadItemExportSafe(slug: string): Promise<ItemExportData | null> {
  try {
    const result = await loadItemExport(slug, true);
    return result.data;
  } catch (error) {
    console.error(`failed to load export for ${slug}`, error);
    return null;
  }
}

type TrendDatasetInput = {
  key: string;
  label: string;
  color: string;
  dataset: ItemExportData | null;
};

function buildTrendDataset(inputs: TrendDatasetInput[]): CpiTrendPoint[] {
  const dateMap = new Map<string, CpiTrendPoint>();

  inputs.forEach(({ key, dataset }) => {
    if (!dataset?.series) return;
    dataset.series.forEach((entry) => {
      if (!entry?.date) return;
      const valueCandidate =
        (entry as { index_value?: number }).index_value ??
        (entry as { index?: number }).index ??
        (entry as { value?: number }).value ??
        null;
      if (valueCandidate === null) return;

      const dateKey = entry.date;
      const current = dateMap.get(dateKey) ?? { date: dateKey };
      current[key] = Number.isFinite(valueCandidate) ? Number(valueCandidate) : null;
      dateMap.set(dateKey, current);
    });
  });

  const sorted = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const limited = sorted.slice(-24);
  return limited as CpiTrendPoint[];
}
