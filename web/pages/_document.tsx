import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const themeColor = "#0f172a";

  return (
    <Html lang="en" className="scroll-smooth">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content={themeColor} />
        <meta name="author" content="Indiainflation" />
        <meta
          name="description"
          content="Indiainflation provides trusted inflation intelligence for India with live CPI dashboards, WPI analysis, and interactive calculators."
        />
        <meta
          name="keywords"
          content="India inflation, CPI, WPI, consumer price index, wholesale price index, inflation calculator, rupee converter, economic data"
        />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Indiainflation" />
        <meta name="application-name" content="Indiainflation" />
        <meta name="msapplication-TileColor" content={themeColor} />

        <meta property="og:title" content="India Inflation Calculator & CPI Insights | Indiainflation" />
        <meta
          property="og:description"
          content="Explore India's inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Indiainflation" />
        <meta property="og:image" content={`${siteUrl.replace(/\/$/, "")}/og-default.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_IN" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="India Inflation Calculator & CPI Insights | Indiainflation" />
        <meta
          name="twitter:description"
          content="Explore India's inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts."
        />
        <meta name="twitter:image" content={`${siteUrl.replace(/\/$/, "")}/og-default.png`} />
        <meta name="twitter:site" content="@indiainflation" />

        <link rel="canonical" href={siteUrl} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="alternate" type="application/rss+xml" href={`${siteUrl}/feed.xml`} />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
      </Head>
      <body className="bg-white text-slate-900">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
