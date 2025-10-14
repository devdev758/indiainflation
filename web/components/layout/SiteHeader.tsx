import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState, type ReactElement } from "react";

import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/calculators", label: "Calculators" },
  { href: "/articles", label: "Articles" },
  { href: "/about", label: "About" }
];

export function SiteHeader(): ReactElement {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [router.pathname]);

  const activePath = useMemo(() => router.pathname, [router.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur transition-shadow",
        scrolled ? "shadow-lg" : "shadow-none"
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">II</span>
          <span className="hidden sm:inline">India Inflation</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" ? activePath === "/" : activePath.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive ? "bg-blue-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden w-full max-w-md lg:block">
          <SearchBar />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "lg:hidden",
          mobileOpen ? "block" : "hidden"
        )}
      >
        <div className="border-t border-slate-200 px-4 py-4">
          <SearchBar />
        </div>
        <nav className="space-y-1 border-t border-slate-200 px-4 py-4">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" ? activePath === "/" : activePath.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-xl px-4 py-3 text-base font-medium transition",
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-100"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
