import Link from "next/link";
import type { ReactElement } from "react";

export function SiteFooter(): ReactElement {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white/70 backdrop-blur">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">II</span>
            <span>Indiainflation</span>
          </div>
          <p className="text-sm text-slate-500">
            Transparent inflation insights and calculators for households, analysts, and policy enthusiasts across India.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link href="/" className="transition hover:text-slate-900">
                Home
              </Link>
            </li>
            <li>
              <Link href="/calculators" className="transition hover:text-slate-900">
                Calculators
              </Link>
            </li>
            <li>
              <Link href="/articles" className="transition hover:text-slate-900">
                Articles
              </Link>
            </li>
            <li>
              <Link href="/about" className="transition hover:text-slate-900">
                About
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Resources</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              <Link href="/privacy" className="transition hover:text-slate-900">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className="transition hover:text-slate-900">
                Disclaimer
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition hover:text-slate-900">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Stay updated</h3>
          <p className="mt-3 text-sm text-slate-500">Subscribe to monthly CPI updates and feature releases.</p>
          <form className="mt-4 flex flex-col gap-2" aria-label="Newsletter signup">
            <input
              type="email"
              placeholder="you@example.com"
              className="h-11 rounded-full border border-slate-300 px-4 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Join waitlist
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-center text-xs text-slate-500 md:flex-row md:items-center md:justify-between md:px-6">
          <span>© {year} Indiainflation. All rights reserved.</span>
          <div className="flex items-center justify-center gap-4">
            <Link href="mailto:hello@indiainflation.in" className="transition hover:text-slate-900">
              hello@indiainflation.in
            </Link>
            <Link href="/disclaimer" className="transition hover:text-slate-900">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
