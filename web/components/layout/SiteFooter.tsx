import Link from "next/link";
import type { ReactElement } from "react";

export function SiteFooter(): ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-800/60 bg-slate-950/85 text-slate-300 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 font-bold text-white shadow-lg">II</span>
            <span className="font-display tracking-tight">Indiainflation</span>
          </div>
          <p className="text-sm text-slate-400">
            Transparent inflation insights and calculators for households, analysts, and policy enthusiasts across India.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/" className="transition hover:text-white">
                Home
              </Link>
            </li>
            <li>
              <Link href="/calculators" className="transition hover:text-white">
                Calculators
              </Link>
            </li>
            <li>
              <Link href="/articles" className="transition hover:text-white">
                Articles
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-white">
                About
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Resources</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <Link href="/privacy" className="transition hover:text-white">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className="transition hover:text-white">
                Disclaimer
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Stay updated</h3>
          <p className="mt-3 text-sm text-slate-400">Subscribe to monthly CPI updates and feature releases.</p>
          <form className="mt-4 flex flex-col gap-2" aria-label="Newsletter signup">
            <input
              type="email"
              placeholder="you@example.com"
              className="h-11 rounded-full border border-slate-700/70 bg-slate-900/60 px-4 text-sm text-white placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-sm font-semibold text-white shadow-md transition hover:from-blue-400 hover:to-indigo-400"
            >
              Join waitlist
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-800/60 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-center text-xs text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
          <span>© {year} Indiainflation. All rights reserved.</span>
          <div className="flex items-center justify-center gap-4">
            <Link href="mailto:hello@indiainflation.com" className="transition hover:text-white">
              hello@indiainflation.com
            </Link>
            <Link href="/disclaimer" className="transition hover:text-white">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
