import Link from "next/link";
import type { ReactElement } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFormatDate } from "@/lib/utils/date";

export type ArticleCardProps = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author?: string;
  categories?: Array<{ id: number; name: string; slug: string }>;
  featuredImage?: string;
};

export function ArticleCard({ slug, title, excerpt, date, author, categories }: ArticleCardProps): ReactElement {
  const formattedDate = safeFormatDate(date, { year: "numeric", month: "long", day: "numeric" });

  return (
    <Card className="h-full">
      <CardHeader className="mb-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-600">
          {categories && categories.length > 0 ? categories.slice(0, 2).map((category) => (
            <span
              key={category.id}
              className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700"
            >
              {category.name}
            </span>
          )) : (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">Insight</span>
          )}
        </div>
        <CardTitle className="text-xl text-slate-900">
          <Link href={`/${slug}`} className="transition hover:text-blue-600">
            {title}
          </Link>
        </CardTitle>
        <CardDescription>{author ? `${author} · ${formattedDate}` : formattedDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none text-slate-600" dangerouslySetInnerHTML={{ __html: excerpt }} />
        <div className="mt-4">
          <Link href={`/${slug}`} className="text-sm font-semibold text-blue-600 hover:underline">
            Read article →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
