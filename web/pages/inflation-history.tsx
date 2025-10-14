import Head from "next/head";
import type { GetStaticProps } from "next";

const TIMELINE = [
  {
    period: "1958-1965",
    title: "Early CPI series",
    description: "Industrial worker CPI launches with limited city coverage, capturing rationing and the early Green Revolution."
  },
  {
    period: "1970s",
    title: "Oil shocks and divergence",
    description: "Dual CPI series for urban and rural households reveal sharp divergences as fuel prices surge."
  },
  {
    period: "1990s",
    title: "Liberalisation and new base years",
    description: "Structural reforms and the 1993-94 consumption survey reshape CPI weights and measurement."
  },
  {
    period: "2010s",
    title: "Combined CPI adoption",
    description: "The combined CPI becomes India’s monetary policy anchor with a 4% midpoint target."
  },
  {
    period: "2020s",
    title: "Climate and supply volatility",
    description: "Weather shocks and supply constraints amplify food inflation volatility across the country."
  }
];

export const getStaticProps: GetStaticProps = async () => ({
  props: {
    generatedAt: new Date().toISOString()
  },
  revalidate: 300
});

export default function InflationHistoryPage({ generatedAt }: { generatedAt: string }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/inflation-history`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "India inflation history",
    url: canonicalUrl,
    dateModified: generatedAt,
    articleSection: TIMELINE.map((entry) => entry.title)
  };

  return (
    <div className="mx-auto max-w-4xl space-y-12 px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>India inflation history timeline | Indiainflation</title>
        <meta
          name="description"
          content="Explore the major milestones that shaped India’s CPI, from early urban indices to today’s combined inflation targeting era."
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <header className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-blue-500">History</p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">India inflation timeline</h1>
        <p className="mx-auto max-w-2xl text-sm text-slate-600">
          A concise chronology of CPI evolution covering basket changes, methodology updates, and structural economic shifts.
        </p>
      </header>

      <section className="space-y-6">
        {TIMELINE.map((entry) => (
          <article key={entry.period} className="rounded-3xl border border-slate-200 bg-white/85 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{entry.period}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{entry.title}</h2>
            <p className="mt-3 text-sm text-slate-600">{entry.description}</p>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm text-sm text-slate-600">
        <h2 className="text-xl font-semibold text-slate-900">Download clean history data</h2>
        <p className="mt-3">
          Visit the datasets page for JSON exports that include metadata for source, sector, frequency, and base year to simplify time-series analysis.
        </p>
      </section>
    </div>
  );
}
