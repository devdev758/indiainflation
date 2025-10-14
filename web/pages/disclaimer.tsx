import Head from "next/head";
import type { ReactElement } from "react";

export default function DisclaimerPage(): ReactElement {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    headline: "Disclaimer",
    url: `${siteUrl}/disclaimer`
  };
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-12 md:px-6">
      <Head>
        <title>Disclaimer | Indiainflation</title>
        <meta name="description" content="Important information regarding Indiainflation’s data sources, accuracy, and intended use." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/disclaimer`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <article className="prose max-w-none prose-headings:text-slate-900 prose-p:text-slate-700">
        <h1>Disclaimer</h1>
        <p>
          Indiainflation aggregates publicly available data including CPI releases, commodity prices, and research
          publications. While we strive for accuracy, we do not guarantee that the datasets or calculators are free from
          errors or delays.
        </p>
        <h2>No financial advice</h2>
        <p>
          The information and tools provided are for informational purposes only and should not be interpreted as
          financial, investment, or legal advice. Users should consult qualified professionals before making financial
          decisions.
        </p>
        <h2>Liability</h2>
        <p>
          Indiainflation is not liable for any losses or damages arising from reliance on the information available on this
          site. Data may be revised by source agencies, and calculated results are estimates.
        </p>
      </article>
    </div>
  );
}
