import Head from "next/head";
import Script from "next/script";
import type { AppProps } from "next/app";
import type { ReactElement } from "react";
import { Inter, Lexend } from "next/font/google";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-sans" });
const lexend = Lexend({ subsets: ["latin"], display: "swap", variable: "--font-display" });

const themeColor = "#0f172a";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const siteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export default function App({ Component, pageProps }: AppProps): ReactElement {
  return (
    <>
      <Head>
        <meta name="theme-color" content={themeColor} />
        {siteVerification ? <meta name="google-site-verification" content={siteVerification} /> : null}
      </Head>
      {gaMeasurementId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
          <Script id="ga4-config" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', { anonymize_ip: true, send_page_view: true });
            `}
          </Script>
        </>
      ) : null}
      <div className={cn(inter.variable, lexend.variable, "relative min-h-screen bg-[#0f172a] antialiased")}>
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_58%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.92),_rgba(15,23,42,1))]" />
        <div className="relative flex min-h-screen flex-col text-slate-900">
          <SiteHeader />
          <main className="flex-1 bg-gradient-to-b from-slate-50/95 via-white/95 to-slate-100/90">
            <Component {...pageProps} />
          </main>
          <SiteFooter />
        </div>
      </div>
    </>
  );
}
