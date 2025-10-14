import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPosts, type PostSummary } from "@/lib/wpClient";

type Props = {
  posts: PostSummary[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const posts = await fetchPosts({ per_page: 18, page: 1 });
    return {
      props: { posts },
      revalidate: 180
    };
  } catch (error) {
    console.error("Failed to fetch articles", error);
    return {
      props: { posts: [] },
      revalidate: 180
    };
  }
};

export default function ArticlesIndex({ posts }: InferGetStaticPropsType<typeof getStaticProps>) {
  const categories = Array.from(
    new Map(posts.flatMap((post) => post.categories ?? []).map((category) => [category.id, category])).values()
  ).slice(0, 6);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.in";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    headline: "Indiainflation Articles",
    url: `${siteUrl}/articles`,
    about: categories.map((category) => category.name)
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:px-6">
      <Head>
        <title>Articles & CPI Analysis | Indiainflation</title>
        <meta
          name="description"
          content="Deep dives on India’s inflation trends, CPI releases, and household budgeting strategies curated by the Indiainflation editorial desk."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/articles`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </Head>

      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-8 py-12 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-300">Articles</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Explainers & inflation intelligence</h1>
            <p className="max-w-2xl text-sm text-slate-200">
              From headline CPI breakdowns to price-segment analysis, our newsroom converts raw MOSPI releases into actionable insights for policymakers, founders, and households.
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
            <Link href="/contact">Pitch a story</Link>
          </Button>
        </div>
        {categories.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            {categories.map((category) => (
              <span key={category.id} className="rounded-full bg-white/10 px-4 py-1 text-slate-100">
                {category.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="grid gap-6 md:grid-cols-2">
          {posts.length === 0 ? (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>No published posts yet</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-500">
                Our editorial team is curating the first set of insights. Please check back after the next CPI release.
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
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
            ))
          )}
        </div>
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Weekly CPI Briefing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>Get a summary of the latest CPI print, food inflation trackers, and policy outlook in your inbox.</p>
              <form className="space-y-2">
                <input
                  type="email"
                  aria-label="Email"
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-full border border-slate-300 px-4 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <Button type="submit" className="w-full rounded-full">Subscribe</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Popular calculators</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-500">
              <Link className="block rounded-xl border border-slate-200 p-3 transition hover:border-blue-200" href="/items/milk">
                Milk CPI Explorer
              </Link>
              <Link className="block rounded-xl border border-slate-200 p-3 transition hover:border-blue-200" href="/items/rice">
                Rice CPI Explorer
              </Link>
              <Link className="block rounded-xl border border-slate-200 p-3 transition hover:border-blue-200" href="/calculators">
                Inflation calculators hub
              </Link>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );
}
