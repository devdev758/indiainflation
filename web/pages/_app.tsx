import type { AppProps } from "next/app";
import type { ReactElement } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-white to-slate-100 font-sans text-slate-900 antialiased">
      <SiteHeader />
      <main className="flex-1 pt-6 md:pt-10">
        <Component {...pageProps} />
      </main>
      <SiteFooter />
    </div>
  );
}
