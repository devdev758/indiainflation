import Head from "next/head";
import type { ReactElement } from "react";

export default function ContactPage(): ReactElement {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: `${siteUrl}/contact`,
    name: "Contact Indiainflation"
  };
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-12 md:px-6">
      <Head>
        <title>Contact Indiainflation</title>
        <meta name="description" content="Reach the Indiainflation editorial and data teams for partnerships, feedback, and data requests." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/contact`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>
      <article className="prose max-w-none prose-headings:text-slate-900 prose-p:text-slate-700">
        <h1>Contact us</h1>
        <p>We’d love to hear from policymakers, researchers, and households using Indiainflation.</p>
        <h2>Email</h2>
        <p>
          General queries: <a href="mailto:hello@indiainflation.in">hello@indiainflation.in</a>
        </p>
        <p>
          Media & partnerships: <a href="mailto:press@indiainflation.in">press@indiainflation.in</a>
        </p>
        <h2>Follow along</h2>
        <ul>
          <li>Newsletter: Monthly CPI briefing with key charts.</li>
          <li>LinkedIn: Announcements and policy explainers.</li>
          <li>X (Twitter): Release-day highlights and quick takes.</li>
        </ul>
      </article>
    </div>
  );
}
