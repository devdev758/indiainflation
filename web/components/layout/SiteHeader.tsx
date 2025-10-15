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
        "sticky top-0 z-40 border-b border-slate-800/60 backdrop-blur-xl transition-shadow",
        scrolled ? "bg-slate-950/85 shadow-lg" : "bg-slate-950/70 shadow-none"
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 text-slate-100 md:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-100">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 font-bold text-white shadow-lg">
            II
          </span>
          <span className="hidden font-display text-[1.05rem] tracking-tight sm:inline">Indiainflation</span>
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
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
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
            className="border-slate-700/60 text-slate-100 hover:border-blue-400 hover:bg-slate-800/70 lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={cn("lg:hidden", mobileOpen ? "block" : "hidden")}>
        <div className="border-t border-slate-800/60 bg-slate-950/90 px-4 py-4">
          <SearchBar />
        </div>
        <nav className="space-y-1 border-t border-slate-800/60 bg-slate-950/95 px-4 py-4">
          {NAV_LINKS.map((link) => {
            const isActive = link.href === "/" ? activePath === "/" : activePath.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-xl px-4 py-3 text-base font-medium transition",
                  isActive ? "bg-gradient-to-r from-blue-500/90 to-indigo-500/90 text-white shadow" : "text-slate-200 hover:bg-slate-800"
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
