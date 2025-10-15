import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type HeroSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  highlight?: ReactNode;
  calculator: ReactNode;
};

export function HeroSection({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  highlight,
  calculator
}: HeroSectionProps): ReactElement {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-6">
        <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">
          {eyebrow}
        </span>
        <div className="space-y-4">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">{title}</h1>
          <p className="max-w-2xl text-lg text-slate-600 md:text-xl">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="shadow-lg">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta ? (
            <Button asChild size="lg" variant="outline" className="border-slate-300/70 bg-white/70 text-slate-800 hover:border-blue-300">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-200/60 bg-white/80 shadow">
            <CardHeader className="space-y-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Household planner</CardTitle>
              <CardDescription className="text-slate-600">Estimate today’s purchase power for historic rupee amounts.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Benchmark your rent, tuition, or grocery budget against the official CPI basket in seconds.
            </CardContent>
          </Card>
          <Card className="border-slate-200/60 bg-white/80 shadow">
            <CardHeader className="space-y-2">
              <CardTitle className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-500">Market outlook</CardTitle>
              <CardDescription className="text-slate-600">Track food, fuel, and core inflation signals curated weekly.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Indiainflation distils raw MOSPI releases into actionable highlights for founders and policy teams.
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="space-y-4">
        {highlight}
        <Card className="border-slate-200/70 bg-white/90 shadow-xl">
          <CardHeader>
            <CardTitle className="font-display text-lg text-slate-900">CPI inflation calculator</CardTitle>
            <CardDescription className="text-slate-600">Convert rupee amounts between years using official indices.</CardDescription>
          </CardHeader>
          <CardContent>{calculator}</CardContent>
        </Card>
      </div>
    </section>
  );
}
