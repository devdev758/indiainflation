import Head from "next/head";
import type { ReactElement } from "react";

import { safeFormatDate } from "@/lib/utils/date";

export default function PrivacyPolicyPage(): ReactElement {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "PrivacyPolicy",
    url: `${siteUrl}/privacy`,
    name: "Indiainflation Privacy Policy"
  };
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-12 md:px-6">
      <Head>
        <title>Privacy Policy | Indiainflation</title>
        <meta name="description" content="Understand how Indiainflation handles analytics data, newsletter signups, and third-party integrations." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/privacy`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <article className="prose max-w-none prose-headings:text-slate-900 prose-p:text-slate-700">
        <h1>Privacy policy</h1>
        <p>Last updated: {safeFormatDate(new Date(), { year: "numeric", month: "short", day: "numeric" })}</p>
        <h2>Data collection</h2>
        <p>
          We collect aggregated analytics to understand how visitors interact with calculators and articles. No personal
          financial information is requested or stored on Indiainflation.
        </p>
        <h2>Newsletter</h2>
        <p>
          Email addresses provided for CPI alerts or newsletters are securely stored with our email provider and are never
          sold or shared with third parties. You can unsubscribe at any time via the link in each email.
        </p>
        <h2>Third-party services</h2>
        <p>
          Indiainflation integrates with Typesense for search and with WordPress for content management. These services
          may process data on our behalf in accordance with their respective privacy policies.
        </p>
        <h2>Questions</h2>
        <p>
          For privacy-related questions, contact <a href="mailto:privacy@indiainflation.in">privacy@indiainflation.in</a>.
        </p>
      </article>
    </div>
  );
}
