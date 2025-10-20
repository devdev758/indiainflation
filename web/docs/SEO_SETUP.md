# SEO & Analytics Setup Guide

## Overview

This document describes the SEO and analytics infrastructure for Indiainflation.com, including structured data, sitemap generation, robots.txt, and GA4 tracking.

## Files Structure

```
web/
├── pages/
│   ├── _document.tsx          # Root HTML with global meta tags
│   ├── sitemap.xml.ts         # Dynamic XML sitemap route
│   ├── robots.txt.ts          # Dynamic robots.txt route
│   └── _app.tsx               # GA4 setup with warning check
├── lib/
│   ├── seoConfig.ts           # Centralized metadata configuration
│   └── structuredData.ts      # JSON-LD schema generators
└── scripts/
    └── validateSeo.ts         # SEO validation script
```

## Components

### 1. `pages/_document.tsx`

The root HTML document that sets global meta tags including:
- Character set and viewport
- Theme color and mobile app config
- Open Graph and Twitter Card defaults
- Preconnects for fonts and analytics
- Canonical URL

**Usage**: Automatically applied to all pages.

### 2. `lib/seoConfig.ts`

Centralized configuration for page-level metadata.

**Key Functions:**

```typescript
// Get metadata for a specific page
const metadata = createPageMetadata("cpiDashboard");

// Generate meta tags with OG/Twitter support
const tags = generateMetaTags(metadata);

// Get canonical URL for a path
const url = getCanonicalUrl("/compare");
```

**Supported Pages:**
- `home` - Homepage
- `cpiDashboard` - /cpi-dashboard
- `compare` - /compare
- `about` - /about
- `datasets` - /datasets
- `contact` - /contact

### 3. `lib/structuredData.ts`

JSON-LD schema generators for search engine rich results.

**Available Schemas:**

```typescript
// Organization schema
const orgSchema = generateOrganizationSchema();

// Website schema with SearchAction
const siteSchema = generateWebsiteSchema();

// Article schema
const articleSchema = generateArticleSchema({
  headline: "Article Title",
  description: "...",
  datePublished: "2024-01-01",
  url: "https://..."
});

// Dataset schema
const datasetSchema = generateDatasetSchema({
  name: "CPI Data",
  description: "...",
  url: "https://..."
});

// Breadcrumb schema
const breadcrumbSchema = generateBreadcrumbSchema([
  { name: "Home", url: "https://..." },
  { name: "Dashboard", url: "https://..." }
]);

// FAQ schema
const faqSchema = generateFAQSchema([
  { question: "Q1", answer: "A1" },
  { question: "Q2", answer: "A2" }
]);
```

### 4. `pages/sitemap.xml.ts`

Dynamic API route that generates an XML sitemap.

**Access Points:**
- `/sitemap.xml` - JSON endpoint returning XML
- Updated daily with proper cache headers

**Included Pages:**
- Home (priority: 1.0, daily)
- CPI Dashboard (priority: 0.9, daily)
- Compare (priority: 0.8, weekly)
- About (priority: 0.7, monthly)
- Datasets (priority: 0.8, weekly)
- Contact (priority: 0.6, yearly)
- Privacy (priority: 0.5, yearly)
- Disclaimer (priority: 0.5, yearly)

**URL Format:**
```
https://indiainflation.com/sitemap.xml
```

### 5. `pages/robots.txt.ts`

Dynamic API route that generates robots.txt.

**Configuration:**
- Allows all crawlers (`User-agent: *`)
- Disallows: `/admin/`, `/api/`, `/internal/`
- References sitemap URL
- Crawl delays for Googlebot and Bingbot

**URL Format:**
```
https://indiainflation.com/robots.txt
```

## Implementation Guide

### Step 1: Enable GA4 Tracking

Set the environment variable:
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Note:** If not set, a console warning appears on page load.

### Step 2: Enhance Individual Pages

In any page component, use `seoConfig`:

```typescript
import Head from "next/head";
import { createPageMetadata, generateMetaTags } from "@/lib/seoConfig";
import { generateOrganizationSchema } from "@/lib/structuredData";

export default function MyPage() {
  const metadata = createPageMetadata("myPageKey");
  const tags = generateMetaTags(metadata);
  const orgSchema = generateOrganizationSchema();

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
        <meta property="og:image" content={tags.openGraph.images[0].url} />
        {/* Twitter */}
        <meta name="twitter:card" content={tags.twitter.card} />
        <meta name="twitter:title" content={tags.twitter.title} />
        {/* Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </Head>
      <main>{/* ... */}</main>
    </>
  );
}
```

### Step 3: Run Validation

Validate SEO setup with:

```bash
npm run validate:seo
```

**Output includes:**
- Environment variable checks
- Required file verification
- Dependency validation
- Meta tag validation
- Recommendations

## Validation Checklist

The `npm run validate:seo` script checks:

- ✓ Environment variables (NEXT_PUBLIC_SITE_URL, GA4 ID)
- ✓ Required files exist
- ✓ React Query setup
- ✓ GA4 warning in _app.tsx
- ✓ Page metadata (Head, meta, canonical)
- ✓ Dependencies (axios, React Query, Recharts)
- ✓ TypeScript configuration

## Testing SEO

### Test Sitemap
```bash
curl https://indiainflation.com/sitemap.xml
```

### Test Robots.txt
```bash
curl https://indiainflation.com/robots.txt
```

### Test Metadata
Use Google's Rich Results Test:
```
https://search.google.com/test/rich-results
```

### Test OG Tags
Use Meta Tag Debugger:
```
https://www.facebook.com/sharing/debugger/
```

## Environment Variables

Required for full SEO functionality:

```bash
# Site configuration
NEXT_PUBLIC_SITE_URL=https://indiainflation.com

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Optional: Social media handles
NEXT_PUBLIC_TWITTER_HANDLE=@indiainflation
NEXT_PUBLIC_LINKEDIN_URL=https://linkedin.com/company/indiainflation
```

## Best Practices

1. **Canonical URLs**: Ensure every page has a unique canonical URL
2. **Meta Descriptions**: Keep descriptions between 150-160 characters
3. **Open Graph Images**: Use 1200x630px images for best appearance
4. **Structured Data**: Always validate JSON-LD with Google's debugger
5. **Sitemap Updates**: Keep sitemap.xml up-to-date with new pages
6. **Robots.txt**: Review and update as needed for new crawl rules
7. **GA4 Tracking**: Ensure GA4 ID is set in production
8. **Mobile Optimization**: All pages must be mobile-responsive
9. **Page Speed**: Monitor Core Web Vitals via GA4
10. **Link Structure**: Use semantic HTML and proper heading hierarchy

## Common Issues & Solutions

### Issue: GA4 not tracking
**Solution**: Check that `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set and correct in production

### Issue: Sitemap returns 404
**Solution**: Ensure `/sitemap.xml.ts` exists and server is built (`npm run build`)

### Issue: Robots.txt not found
**Solution**: Ensure `/robots.txt.ts` exists and proper Next.js API setup

### Issue: Meta tags not rendering
**Solution**: Check `_document.tsx` is properly configured and all pages use `Head` component

### Issue: Structured data not validating
**Solution**: Use Google's Structured Data Debugger and ensure JSON-LD is valid

## References

- [Next.js Document](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started)
- [Schema.org Vocabulary](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)

## Next Steps

1. Add more schema types as needed (LocalBusiness, Product, etc.)
2. Implement hreflang tags for international SEO
3. Add structured data for blog articles
4. Set up Google Search Console
5. Monitor Core Web Vitals
6. Create XML sitemap index for larger sites
7. Implement AMP versions if needed

---

Last Updated: 2024-10-20
