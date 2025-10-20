import Head from "next/head";
import { useState, useMemo } from "react";
import { Search, BookOpen, Code2, Zap } from "lucide-react";
import { ApiEndpointCard } from "@/components/ApiEndpointCard";
import { useApiDocs } from "@/hooks/useApiDocs";
import {
  apiEndpoints,
  getCategories,
  getEndpointsByCategory,
  getAllEndpoints,
} from "@/lib/apiDocsData";
import { generateDatasetSchema, generateBreadcrumbSchema } from "@/lib/structuredData";

export default function ApiDocsPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
  const canonicalUrl = `${siteUrl.replace(/\/$/, "")}/api-docs`;

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // API testing hook
  const { testStates, testEndpoint } = useApiDocs();

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    let filtered = getAllEndpoints();

    if (selectedCategory) {
      filtered = filtered.filter((ep) => ep.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ep) =>
          ep.title.toLowerCase().includes(query) ||
          ep.description.toLowerCase().includes(query) ||
          ep.path.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const categories = getCategories();

  // SEO schemas
  const datasetSchema = generateDatasetSchema({
    name: "India Inflation Data API",
    description: "Comprehensive RESTful API for accessing historical CPI, WPI, and inflation data for India",
    url: canonicalUrl,
    keywords: ["API", "CPI", "WPI", "inflation", "REST", "documentation"],
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "API Documentation", url: canonicalUrl },
  ]);

  return (
    <>
      <Head>
        <title>India Inflation Data API Documentation | Indiainflation</title>
        <meta
          name="description"
          content="Comprehensive API documentation for accessing historical CPI, WPI, and inflation data for India. Includes live examples, SDKs, and integration guides."
        />
        <meta
          name="keywords"
          content="API documentation, CPI API, WPI API, inflation data API, REST API, India inflation"
        />
        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content="India Inflation Data API Documentation" />
        <meta
          property="og:description"
          content="Public API for accessing 66 years of CPI and WPI data for India"
        />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="India Inflation Data API" />
        <meta name="twitter:description" content="Access historical inflation data via REST API" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-10 md:px-6">
        {/* Hero Section */}
        <section className="mb-12 space-y-6">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-500 p-8 text-white shadow-xl">
            <div className="space-y-3 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-100">
                Developer Documentation
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
                India Inflation Data API
              </h1>
              <p className="text-sm text-indigo-100">
                Comprehensive REST API for accessing 66 years of CPI, WPI, and inflation data for India.
                Real-time updates, flexible filtering, and powerful analytics tools.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <a
                  href="#endpoints"
                  className="inline-flex items-center gap-2 rounded-lg bg-white text-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-50 transition"
                >
                  <Code2 className="h-4 w-4" />
                  View Endpoints
                </a>
                <a
                  href="https://github.com/indiainflation/api-examples"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-white text-white px-4 py-2 text-sm font-semibold hover:bg-white hover:text-indigo-600 transition"
                >
                  <BookOpen className="h-4 w-4" />
                  GitHub Examples
                </a>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-3xl font-bold text-indigo-600">5</p>
              <p className="text-sm text-slate-600">Endpoints</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-3xl font-bold text-green-600">66+</p>
              <p className="text-sm text-slate-600">Years of Data</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-3xl font-bold text-blue-600">99.9%</p>
              <p className="text-sm text-slate-600">Uptime</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-3xl font-bold text-orange-600">100/min</p>
              <p className="text-sm text-slate-600">Rate Limit</p>
            </div>
          </div>
        </section>

        {/* Overview Section */}
        <section className="mb-12 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Getting Started</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Base URL */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Base URL</h3>
              </div>
              <p className="font-mono text-sm text-slate-700 break-all">
                https://indiainflation.com
              </p>
              <p className="text-xs text-slate-600">
                All requests use HTTPS. No authentication required for basic access.
              </p>
            </div>

            {/* Rate Limits */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Rate Limits</h3>
              </div>
              <ul className="space-y-1 text-sm text-slate-700">
                <li>• 100 requests/minute (default)</li>
                <li>• 1000 requests/hour</li>
                <li>• Higher limits with API key</li>
              </ul>
            </div>

            {/* Response Format */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                  <Zap className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-900">Response Format</h3>
              </div>
              <p className="font-mono text-sm text-slate-700">JSON</p>
              <p className="text-xs text-slate-600">
                All responses use UTF-8 encoding with proper Content-Type headers.
              </p>
            </div>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="mb-8 space-y-4" id="endpoints">
          <h2 className="text-2xl font-bold text-slate-900">API Endpoints</h2>

          <div className="space-y-4 md:flex md:gap-4 md:space-y-0">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search endpoints..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  selectedCategory === null
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                All ({apiEndpoints.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    selectedCategory === cat
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {cat} ({getEndpointsByCategory(cat).length})
                </button>
              ))}
            </div>
          </div>

          {/* Results */}
          {filteredEndpoints.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-600">
                No endpoints found matching your search.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEndpoints.map((endpoint) => (
                <ApiEndpointCard
                  key={endpoint.id}
                  endpoint={endpoint}
                  onTest={testEndpoint}
                  testLoading={testStates[endpoint.id]?.loading}
                  testError={testStates[endpoint.id]?.error}
                  testResponse={testStates[endpoint.id]?.response}
                />
              ))}
            </div>
          )}
        </section>

        {/* Integration Examples */}
        <section className="mb-12 space-y-6">
          <h2 className="text-2xl font-bold text-slate-900">Integration Examples</h2>

          <div className="space-y-6">
            {/* JavaScript Example */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
              <h3 className="font-semibold text-slate-900">Fetch Historical CPI (JavaScript)</h3>
              <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm font-mono text-slate-900">
                {`const response = await fetch(
  'https://indiainflation.com/api/inflation/historical?from_date=2020-01&to_date=2024-10'
);
const data = await response.json();
console.log(data.data); // Array of monthly CPI values`}
              </pre>
            </div>

            {/* Python Example */}
            <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-3">
              <h3 className="font-semibold text-slate-900">Calculate Inflation Impact (Python)</h3>
              <pre className="overflow-x-auto rounded-lg bg-slate-100 p-4 text-sm font-mono text-slate-900">
                {`import requests

response = requests.post(
  'https://indiainflation.com/api/inflation/calculator',
  json={
    "amount": 100000,
    "from_date": "2010-01",
    "to_date": "2024-10"
  }
)
result = response.json()
print(f"₹{result['amount']} in 2010 = ₹{result['equivalent_value']} in 2024")`}
              </pre>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-8 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Need Help?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">📚 Documentation</h3>
              <p className="text-sm text-slate-700">
                Read detailed guides and best practices in our{" "}
                <a href="/docs" className="text-indigo-600 hover:underline">
                  documentation center
                </a>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">💬 Community</h3>
              <p className="text-sm text-slate-700">
                Ask questions and share ideas on our{" "}
                <a href="https://github.com/indiainflation" className="text-indigo-600 hover:underline">
                  GitHub Discussions
                </a>
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">📧 Support</h3>
              <p className="text-sm text-slate-700">
                Contact us at{" "}
                <a href="mailto:api-support@indiainflation.com" className="text-indigo-600 hover:underline">
                  api-support@indiainflation.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
