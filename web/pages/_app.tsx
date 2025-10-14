import type { AppProps } from "next/app";
import type { ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo } from "react";

import SearchBar from "@/components/SearchBar";
import "@/styles/globals.css";

function Header(): ReactElement {
  const router = useRouter();
  const isHome = useMemo(() => router.pathname === "/", [router.pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-bold text-white">II</span>
          <span>Indiainflation</span>
        </Link>
        <div className="hidden w-full max-w-xl md:block">
          <SearchBar />
        </div>
        <div className="md:hidden" aria-hidden="true">
          {isHome ? null : <span className="text-sm text-slate-500">Search</span>}
        </div>
      </div>
      <div className="block border-t border-slate-100 px-6 pb-4 pt-2 md:hidden">
        <SearchBar />
      </div>
    </header>
  );
}

export default function App({ Component, pageProps }: AppProps): ReactElement {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="pt-6 md:pt-8">
        <Component {...pageProps} />
      </main>
    </div>
  );
}
