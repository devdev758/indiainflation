import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, User, Share2, Linkedin, Twitter } from "lucide-react";
import { useRouter } from "next/router";
import { ArticleRelatedLinks } from "@/components/RelatedLinks";
import { useInsight } from "@/hooks/useInsights";
import { generateArticleSchema, generateBreadcrumbSchema } from "@/lib/structuredData";

export default function InsightArticlePage() {
  const router = useRouter();
  const { slug } = router.query;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";

  const { data: article, isLoading, error } = useInsight(slug as string);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 mx-auto" />
            <p className="text-sm text-slate-600">Loading article...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-700 mb-4">Article not found</p>
          <Link href="/insights" className="text-blue-600 hover:underline">
            ← Back to Insights
          </Link>
        </div>
      </div>
    );
  }

  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/insights/${article.slug}`;
  const publishDate = new Date(article.date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const articleSchema = generateArticleSchema({
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    dateModified: article.modified || article.date,
    author: article.author?.name || "Indiainflation",
    image: article.featured_media_url,
    url: canonicalUrl,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Insights", url: `${siteUrl}/insights` },
    { name: article.title, url: canonicalUrl },
  ]);

  const shareUrl = encodeURIComponent(canonicalUrl);
  const shareTitle = encodeURIComponent(article.title);

  return (
    <>
      <Head>
        <title>{article.title} | Indiainflation Insights</title>
        <meta name="description" content={article.excerpt} />
        <meta name="keywords" content={article.tags?.join(", ") || "inflation, CPI, economic analysis"} />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        {article.featured_media_url && <meta property="og:image" content={article.featured_media_url} />}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={article.title} />
        <meta name="twitter:description" content={article.excerpt} />
        {article.featured_media_url && <meta name="twitter:image" content={article.featured_media_url} />}

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="mx-auto max-w-3xl space-y-12 px-4 pb-20 pt-10 md:px-6">
        {/* Header */}
        <header className="space-y-4 border-b border-slate-200 pb-8">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Insights
          </Link>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {article.categories?.map((cat) => (
                <span key={cat} className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  {cat}
                </span>
              ))}
            </div>

            <h1 className="text-4xl font-bold text-slate-900">{article.title}</h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
              {article.author && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{article.author.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{publishDate}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {article.featured_media_url && (
          <div className="relative h-96 w-full overflow-hidden rounded-lg bg-slate-100">
            <Image
              src={article.featured_media_url}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Article Excerpt */}
        <p className="text-lg font-semibold text-slate-700">{article.excerpt}</p>

        {/* Share Buttons */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Share:</span>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition"
            title="Share on LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-blue-50 hover:text-blue-400 transition"
            title="Share on Twitter"
          >
            <Twitter className="h-4 w-4" />
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(canonicalUrl);
              alert("Link copied to clipboard!");
            }}
            className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 transition"
            title="Copy link"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-a:text-blue-600 prose-a:hover:underline">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </article>

        {/* Author Bio */}
        {article.author && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <h3 className="font-semibold text-slate-900">About the Author</h3>
            <p className="mt-2 text-sm text-slate-700">{article.author.name}</p>
            {article.author.url && (
              <a href={article.author.url} className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                Visit author website →
              </a>
            )}
          </div>
        )}

        {/* Related Content */}
        <ArticleRelatedLinks slug={article.slug} />

        {/* Related Insights */}
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Related Articles</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {article.categories?.map((cat) => (
              <Link
                key={cat}
                href={`/insights?category=${cat}`}
                className="rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition"
              >
                <p className="font-medium text-slate-900">{cat}</p>
                <p className="mt-1 text-xs text-slate-600">View all articles in this category</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
