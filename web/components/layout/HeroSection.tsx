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
        <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
          {eyebrow}
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{title}</h1>
          <p className="max-w-2xl text-lg text-slate-600">{description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={primaryCta.href}>{primaryCta.label}</Link>
          </Button>
          {secondaryCta ? (
            <Button asChild size="lg" variant="outline">
              <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          ) : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Household planner</CardTitle>
              <CardDescription>Estimate today’s purchase power for historic rupee amounts.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Benchmark your rent, tuition, or grocery budget against the official CPI basket in seconds.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Market outlook</CardTitle>
              <CardDescription>Track food, fuel, and core inflation signals curated weekly.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-500">
              Indiainflation distils raw MOSPI releases into actionable highlights for founders and policy teams.
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="space-y-4">
        {highlight}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">CPI inflation calculator</CardTitle>
            <CardDescription>Convert rupee amounts between years using official indices.</CardDescription>
          </CardHeader>
          <CardContent>{calculator}</CardContent>
        </Card>
      </div>
    </section>
  );
}
