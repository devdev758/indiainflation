import Link from "next/link";
import type { ReactElement } from "react";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { Button } from "@/components/ui/button";
import type { PostSummary } from "@/lib/wpClient";

type LatestArticlesGridProps = {
  posts: PostSummary[];
};

export function LatestArticlesGrid({ posts }: LatestArticlesGridProps): ReactElement {
  if (posts.length === 0) {
    return (
      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">Latest articles</h2>
            <p className="text-slate-500">Fresh CPI explainers arriving soon after the next release window.</p>
          </div>
        </div>
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500">
          Our editorial desk is preparing new insights. Check back shortly for updated commentary.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold text-slate-900">Latest articles</h2>
          <p className="text-slate-500">Weekly explainers decoding inflation signals across India’s CPI basket.</p>
        </div>
        <Button asChild variant="ghost">
          <Link href="/articles">View all articles</Link>
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <ArticleCard
            key={post.id}
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt}
            date={post.date}
            author={post.author}
            categories={post.categories}
            featuredImage={post.featuredImage}
          />
        ))}
      </div>
    </section>
  );
}
