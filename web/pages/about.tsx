import Head from "next/head";
import type { ReactElement } from "react";

export default function AboutPage(): ReactElement {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    headline: "About Indiainflation",
    url: `${siteUrl}/about`
  };
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-12 md:px-6">
      <Head>
        <title>About Indiainflation</title>
        <meta
          name="description"
          content="Indiainflation combines official CPI releases, ETL pipelines, and editorial analysis to help India track price movements with clarity."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/about`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <article className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700">
        <h1>About Indiainflation</h1>
        <p>
          Indiainflation is a civic data initiative that transforms consumer price index releases into accessible dashboards
          and calculators. Our team pairs technologists, economists, and designers to make inflation insights available to
          every household and entrepreneur.
        </p>
        <h2>What we do</h2>
        <ul>
          <li>Collect, clean, and index CPI data published by the Ministry of Statistics and Programme Implementation.</li>
          <li>Publish weekly explainers that break down price movements across food, fuel, and core inflation components.</li>
          <li>Offer calculators to convert historical rupee amounts and compare CPI items across time.</li>
        </ul>
        <h2>Our mission</h2>
        <p>
          We believe transparent inflation data is critical for personal finance decisions, public policy, and business
          planning. Indiainflation exists to close the gap between raw statistical releases and the daily choices citizens make.
        </p>
      </article>
    </div>
  );
}
