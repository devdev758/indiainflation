import Head from "next/head";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { InsightCard } from "@/components/InsightCard";
import { InsightRelatedLinks } from "@/components/RelatedLinks";
import { useInsightsList, useInsightCategories } from "@/hooks/useInsights";
import { generateBreadcrumbSchema } from "@/lib/structuredData";

export default function InsightsIndexPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/insights`;

  // State management
  const [page, setPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");

  // Data fetching
  const { data: insightsData, isLoading, error } = useInsightsList(page, selectedCategory, searchQuery);
  const { data: categories } = useInsightCategories();

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Insights", url: canonicalUrl },
  ]);

  // Pagination calculations
  const totalPages = insightsData?.pages || 1;
  const articles = insightsData?.articles || [];

  const pageNumbers = useMemo(() => {
    const nums = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      nums.push(i);
    }
    return nums;
  }, [page, totalPages]);

  return (
    <>
      <Head>
        <title>Inflation Insights & Analysis | Indiainflation</title>
        <meta
          name="description"
          content="Read in-depth articles on inflation trends, economic analysis, and CPI insights for India. Educational content on inflation dynamics and monetary policy."
        />
        <meta
          name="keywords"
          content="inflation insights, CPI analysis, economic news, India inflation, monetary policy, inflation trends"
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content="Inflation Insights & Analysis | Indiainflation" />
        <meta
          property="og:description"
          content="Educational articles on inflation, CPI trends, and economic analysis for India"
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="mx-auto max-w-7xl space-y-12 px-4 pb-20 pt-10 md:px-6">
        {/* Hero Section */}
        <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-8 text-white shadow-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-100">Insights</p>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Inflation Insights & Analysis</h1>
            <p className="max-w-3xl text-sm text-blue-100">
              Explore in-depth articles on inflation trends, CPI analysis, and economic insights from India's leading inflation intelligence platform.
            </p>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Search & Filter</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={selectedCategory || ""}
                onChange={(e) => {
                  setSelectedCategory(e.target.value || undefined);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(undefined);
                setPage(1);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </section>

        {/* Articles Grid */}
        <section className="space-y-6">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center">
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500 mx-auto" />
                <p className="text-sm text-slate-600">Loading insights...</p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-sm text-red-700">Failed to load insights. Please try again later.</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <p className="text-sm text-slate-600">No articles found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <InsightCard
                    key={article.id}
                    slug={article.slug}
                    title={article.title}
                    excerpt={article.excerpt}
                    date={article.date}
                    categories={article.categories}
                    image={article.featured_media_url}
                    author={article.author?.name}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 border-t border-slate-200 pt-8">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="rounded border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {pageNumbers.map((num) => (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`rounded px-3 py-2 text-sm font-medium ${
                        page === num
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {num}
                    </button>
                  ))}

                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="rounded border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Related Links */}
        <InsightRelatedLinks />

        {/* Info Section */}
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-6 space-y-3">
          <h3 className="font-semibold text-slate-900">About Our Insights</h3>
          <p className="text-sm text-slate-700">
            Our insights are written by economists and inflation analysts who track India's economic data in real-time. Each
            article is backed by official statistics from MoSPI, DPIIT, and RBI.
          </p>
          <p className="text-sm text-slate-700">
            Subscribe to our newsletter for weekly inflation analysis and updates on CPI, WPI, and broader economic trends
            affecting India.
          </p>
        </section>
      </div>
    </>
  );
}
