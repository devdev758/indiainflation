# Structured Data Implementation Examples

## Example 1: Using Organization Schema

```typescript
// pages/about.tsx
import Head from "next/head";
import { generateOrganizationSchema } from "@/lib/structuredData";

export default function AboutPage() {
  const orgSchema = generateOrganizationSchema();

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </Head>
      <main>
        {/* Page content */}
      </main>
    </>
  );
}
```

**Rendered JSON-LD:**
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Indiainflation",
  "url": "https://indiainflation.com",
  "description": "India's trusted inflation intelligence platform...",
  "sameAs": [
    "https://twitter.com/indiainflation",
    "https://www.linkedin.com/company/indiainflation"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "support@indiainflation.com"
  }
}
```

---

## Example 2: Using Website Schema with SearchAction

```typescript
// pages/index.tsx
import { generateWebsiteSchema } from "@/lib/structuredData";

export default function HomePage() {
  const websiteSchema = generateWebsiteSchema();

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      </Head>
      {/* ... */}
    </>
  );
}
```

**Rendered JSON-LD:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Indiainflation",
  "url": "https://indiainflation.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://indiainflation.com/compare?search={search_term}",
    "query-input": "required name=search_term"
  }
}
```

**How Google Uses It:** Adds a search box on the knowledge panel for the site.

---

## Example 3: Using Dataset Schema

```typescript
// pages/datasets.tsx
import { generateDatasetSchema } from "@/lib/structuredData";

export default function DatasetsPage() {
  const cpiDataset = generateDatasetSchema({
    name: "India CPI National Dataset",
    description: "Monthly consumer price index from Ministry of Statistics",
    url: "https://indiainflation.com/datasets/cpi",
    keywords: ["CPI", "inflation", "consumer price index"],
    measurementTechnique: "Consumer Price Index (CPI)",
    spatialCoverage: "IN",
    dateModified: new Date().toISOString()
  });

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cpiDataset) }} />
      </Head>
      {/* ... */}
    </>
  );
}
```

**Result:** Appears in Google Dataset Search results

---

## Example 4: Using Article Schema

```typescript
// pages/blog/article.tsx
import { generateArticleSchema } from "@/lib/structuredData";

export default function ArticlePage() {
  const articleSchema = generateArticleSchema({
    headline: "Understanding India's Food Inflation Crisis",
    description: "A deep dive into the drivers of food price increases...",
    datePublished: "2024-10-20",
    dateModified: "2024-10-21",
    author: "Indiainflation Editorial",
    image: "https://indiainflation.com/og-article.png",
    url: "https://indiainflation.com/blog/food-inflation"
  });

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      </Head>
      <article>
        <h1>Understanding India's Food Inflation Crisis</h1>
        {/* Article content */}
      </article>
    </>
  );
}
```

**Result:** Rich snippets in search results with publication date and author

---

## Example 5: Using Breadcrumb Schema

```typescript
// pages/cpi-dashboard.tsx
import { generateBreadcrumbSchema } from "@/lib/structuredData";

export default function CpiDashboardPage() {
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "https://indiainflation.com" },
    { name: "Dashboards", url: "https://indiainflation.com/dashboards" },
    { name: "CPI Dashboard", url: "https://indiainflation.com/cpi-dashboard" }
  ]);

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      </Head>
      {/* Page content */}
    </>
  );
}
```

**Result:** Breadcrumb navigation in search results

---

## Example 6: Using FAQ Schema

```typescript
// pages/faq.tsx
import { generateFAQSchema } from "@/lib/structuredData";

export default function FAQPage() {
  const faqSchema = generateFAQSchema([
    {
      question: "What is CPI?",
      answer: "Consumer Price Index (CPI) measures the average changes in prices paid by consumers for goods and services over time."
    },
    {
      question: "How often is CPI released?",
      answer: "CPI data is released monthly by the Ministry of Statistics and Programme Implementation (MoSPI)."
    },
    {
      question: "What's the difference between CPI and WPI?",
      answer: "CPI measures retail prices, while WPI measures wholesale prices. WPI often leads CPI changes by 2-3 months."
    }
  ]);

  return (
    <>
      <Head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      </Head>
      <main>
        {/* FAQ content */}
      </main>
    </>
  );
}
```

**Result:** Expandable FAQ section in search results

---

## Example 7: Using seoConfig for Centralized Meta Tags

```typescript
// pages/compare.tsx
import Head from "next/head";
import { createPageMetadata, generateMetaTags } from "@/lib/seoConfig";

export default function ComparePage() {
  const metadata = createPageMetadata("compare");
  const tags = generateMetaTags(metadata);

  return (
    <>
      <Head>
        <title>{tags.title}</title>
        <meta name="description" content={tags.description} />
        <meta name="keywords" content={tags.keywords} />
        <link rel="canonical" href={tags.canonical} />
        
        {/* Open Graph */}
        <meta property="og:title" content={tags.openGraph.title} />
        <meta property="og:description" content={tags.openGraph.description} />
        <meta property="og:url" content={tags.openGraph.url} />
        <meta property="og:type" content={tags.openGraph.type} />
        <meta property="og:siteName" content={tags.openGraph.siteName} />
        {tags.openGraph.images.map((img, idx) => (
          <meta key={idx} property="og:image" content={img.url} />
        ))}
        
        {/* Twitter Card */}
        <meta name="twitter:card" content={tags.twitter.card} />
        <meta name="twitter:title" content={tags.twitter.title} />
        <meta name="twitter:description" content={tags.twitter.description} />
        {tags.twitter.images.map((img, idx) => (
          <meta key={idx} name="twitter:image" content={img} />
        ))}
      </Head>
      <main>{/* Page content */}</main>
    </>
  );
}
```

---

## Example 8: Multiple Schemas on One Page

```typescript
// pages/compare.tsx
import Head from "next/head";
import { generateOrganizationSchema, generateWebsiteSchema, generateBreadcrumbSchema } from "@/lib/structuredData";

export default function ComparePage() {
  const orgSchema = generateOrganizationSchema();
  const siteSchema = generateWebsiteSchema();
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "https://indiainflation.com" },
    { name: "Compare CPI vs WPI", url: "https://indiainflation.com/compare" }
  ]);

  const schemas = [orgSchema, siteSchema, breadcrumbs];

  return (
    <>
      <Head>
        {schemas.map((schema, idx) => (
          <script 
            key={idx} 
            type="application/ld+json" 
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} 
          />
        ))}
      </Head>
      <main>{/* Page content */}</main>
    </>
  );
}
```

---

## Validation & Testing

### Validate with Google's Structured Data Testing Tool

```
https://search.google.com/test/rich-results
```

1. Enter your URL
2. Click "Test URL"
3. Check for any errors or warnings
4. Verify rich result eligibility

### Validate with Schema.org Validator

```
https://validator.schema.org/
```

1. Paste your JSON-LD code
2. Check for validation errors
3. Review property recommendations

### Check with Google Search Console

1. Go to Google Search Console
2. Choose your property
3. Click "Enhancements" in the left menu
4. Review structured data coverage and issues

---

## Best Practices

1. **Always validate**: Use Google's tools before deploying
2. **Be specific**: Use the most specific schema type available
3. **Don't over-markup**: Only mark up main content, not navigation
4. **Keep it updated**: Ensure dates and content are current
5. **Test URLs**: Test actual published URLs, not localhost
6. **Monitor performance**: Check Search Console for coverage issues
7. **Use context**: Provide complete information in schemas
8. **Follow guidelines**: Adhere to Search Engine guidelines

---

## Common Mistakes to Avoid

❌ **Wrong:** Markup invisible content
✅ **Right:** Only markup visible, relevant content

❌ **Wrong:** Multiple homepage schemas on every page
✅ **Right:** Use specific schema for each page type

❌ **Wrong:** Outdated dates in article schema
✅ **Right:** Keep publication/modification dates current

❌ **Wrong:** Incomplete organization info
✅ **Right:** Include name, URL, contact points

❌ **Wrong:** Invalid JSON-LD syntax
✅ **Right:** Validate all JSON-LD output

---

Last Updated: 2024-10-20
