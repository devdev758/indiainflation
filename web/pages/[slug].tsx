import Image from "next/image";
import Head from "next/head";
import Link from "next/link";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";

import { ArticleCard } from "@/components/articles/ArticleCard";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFormatDate } from "@/lib/utils/date";
import { fetchPostBySlug, fetchPosts, fetchRelatedPosts, type PostDetail, type PostSummary } from "@/lib/wpClient";

type Props = {
  post: PostDetail;
  related: PostSummary[];
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const posts = await fetchPosts({ per_page: 50, page: 1 });
    return {
      paths: posts.map((post) => ({ params: { slug: post.slug } })),
      fallback: "blocking"
    };
  } catch (error) {
    console.error("Failed to build blog paths", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";

  try {
    const post = await fetchPostBySlug(slug);
    if (!post) {
      return { notFound: true, revalidate: 60 };
    }

    const related = await fetchRelatedPosts({
      categories: post.categories?.map((category) => category.id) ?? [],
      excludeId: post.id,
      per_page: 3
    });

    return {
      props: { post, related },
      revalidate: 300
    };
  } catch (error) {
    console.error(`Failed to fetch post for slug ${slug}`, error);
    return { notFound: true, revalidate: 60 };
  }
};

export default function BlogPostPage({ post, related }: InferGetStaticPropsType<typeof getStaticProps>) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const plainExcerpt = stripHtml(post.excerpt).slice(0, 155);
  const shareUrl = `${siteUrl}/${post.slug}`;
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: plainExcerpt,
    author: post.author ? { "@type": "Person", name: post.author } : undefined,
    datePublished: post.date,
    image: post.featuredImage,
    url: shareUrl
  };

  return (
    <article className="mx-auto max-w-4xl px-4 pb-20 pt-10">
      <Head>
        <title>{post.title} | India Inflation</title>
        <meta name="description" content={plainExcerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={stripHtml(post.excerpt).slice(0, 200)} />
        {post.featuredImage && <meta property="og:image" content={post.featuredImage} />}
        <meta property="og:url" content={shareUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Indiainflation" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={plainExcerpt} />
        {post.featuredImage && <meta name="twitter:image" content={post.featuredImage} />}
        <link rel="canonical" href={shareUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      </Head>
      <header className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {(post.categories ?? []).map((category) => (
            <span key={category.id} className="rounded-full bg-blue-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
              {category.name}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
          {post.author && <span>By {post.author}</span>}
          <span>{safeFormatDate(post.date, { year: "numeric", month: "long", day: "numeric" })}</span>
          <span>· {post.readingTimeMinutes} min read</span>
        </div>
        <ShareButtons title={post.title} url={shareUrl} />
      </header>
      {post.featuredImage && (
        <div className="relative my-8 overflow-hidden rounded-3xl border border-slate-200 shadow-lg">
          <Image
            src={post.featuredImage}
            alt={post.featuredImageAlt ?? post.title}
            width={1280}
            height={720}
            className="h-auto w-full object-cover"
            priority
          />
        </div>
      )}
      <div className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600">
        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>

      {(post.tags?.length ?? 0) > 0 && (
        <div className="mt-12">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Tags</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {post.tags.map((tag) => (
              <span key={tag.id} className="rounded-full bg-slate-100 px-4 py-1 text-slate-600">
                #{tag.slug}
              </span>
            ))}
          </div>
        </div>
      )}

      {related.length > 0 && (
        <section className="mt-16 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Related posts</h2>
            <Link href="/articles" className="text-sm font-medium text-blue-600 hover:underline">
              View all articles
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {related.map((item) => (
              <ArticleCard
                key={item.id}
                slug={item.slug}
                title={item.title}
                excerpt={item.excerpt}
                date={item.date}
                author={item.author}
                categories={item.categories}
                featuredImage={item.featuredImage}
              />
            ))}
          </div>
        </section>
      )}

      <Card className="mt-16">
        <CardHeader>
          <CardTitle>Continue exploring</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 text-sm text-slate-600">
          <Link className="rounded-full border border-slate-300 px-4 py-2 transition hover:border-blue-400" href="/calculators">
            CPI Calculators hub
          </Link>
          <Link className="rounded-full border border-slate-300 px-4 py-2 transition hover:border-blue-400" href="/items/cpi-all-items">
            Headline CPI explorer
          </Link>
          <Link className="rounded-full border border-slate-300 px-4 py-2 transition hover:border-blue-400" href="/items/wpi-all-commodities">
            WPI dashboard
          </Link>
        </CardContent>
      </Card>
    </article>
  );
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
