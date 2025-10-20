export interface SEOMetadata {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  keywords?: string;
  robots?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";
const DEFAULT_OG_IMAGE = `${SITE_URL.replace(/\/$/, "")}/og-default.png`;

export const PAGE_METADATA: Record<string, SEOMetadata> = {
  home: {
    title: "India Inflation Calculator & CPI Insights | Indiainflation",
    description:
      "Explore India's inflation trends, convert historical prices, and read the latest CPI analysis for households and analysts.",
    canonical: SITE_URL,
    ogType: "website",
    keywords: "India inflation, CPI, WPI, inflation calculator, rupee converter, economic data"
  },
  cpiDashboard: {
    title: "India CPI Dashboard | Indiainflation",
    description:
      "Interactive CPI dashboard with state-wise inflation rates, group-wise analysis, and downloadable datasets. Analyse long-run trends and regional divergence.",
    canonical: `${SITE_URL}/cpi-dashboard`,
    ogType: "website",
    keywords: "CPI dashboard, state-wise inflation, India CPI, consumer price index, inflation analysis"
  },
  compare: {
    title: "Compare CPI vs WPI | Indiainflation",
    description:
      "Interactive tool to compare consumer price index (CPI) with wholesale price index (WPI) trends. Analyse divergence and download data for offline modelling.",
    canonical: `${SITE_URL}/compare`,
    ogType: "website",
    keywords: "CPI vs WPI comparison, wholesale price index, inflation comparison, India economic data"
  },
  about: {
    title: "About Indiainflation | Methodology & Data Sources",
    description:
      "Learn about Indiainflation's methodology, data sources (MoSPI, IMF, DPIIT), and mission to democratize inflation intelligence for India.",
    canonical: `${SITE_URL}/about`,
    ogType: "website",
    keywords: "about Indiainflation, CPI methodology, inflation data sources, MoSPI, DPIIT"
  },
  datasets: {
    title: "Inflation Datasets & Downloads | Indiainflation",
    description: "Download curated CPI and WPI datasets in CSV, JSON, and Excel formats for research, analysis, and modelling.",
    canonical: `${SITE_URL}/datasets`,
    ogType: "website",
    keywords: "inflation datasets, CPI data download, WPI data, economic datasets, India statistics"
  },
  contact: {
    title: "Contact Us | Indiainflation",
    description: "Get in touch with the Indiainflation team. We welcome feedback, partnership inquiries, and data collaboration requests.",
    canonical: `${SITE_URL}/contact`,
    ogType: "website",
    keywords: "contact indiainflation, feedback, partnerships, inflation data"
  }
};

export function generateMetaTags(metadata: SEOMetadata) {
  return {
    title: metadata.title,
    description: metadata.description,
    keywords: metadata.keywords || "",
    robots: metadata.robots || "index, follow",
    canonical: metadata.canonical || SITE_URL,
    openGraph: {
      title: metadata.title,
      description: metadata.description,
      url: metadata.canonical || SITE_URL,
      type: metadata.ogType || "website",
      images: [
        {
          url: metadata.ogImage || DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: metadata.title
        }
      ],
      siteName: "Indiainflation"
    },
    twitter: {
      card: metadata.twitterCard || "summary_large_image",
      title: metadata.title,
      description: metadata.description,
      images: [metadata.ogImage || DEFAULT_OG_IMAGE]
    }
  };
}

export function getCanonicalUrl(path: string): string {
  const basePath = SITE_URL.replace(/\/$/, "");
  if (path === "/") return basePath;
  return `${basePath}${path}`;
}

export function createPageMetadata(pageKey: keyof typeof PAGE_METADATA): SEOMetadata {
  const meta = PAGE_METADATA[pageKey];
  if (!meta) {
    return {
      title: "Indiainflation",
      description: "Trusted inflation intelligence for India",
      canonical: SITE_URL
    };
  }
  return {
    ...meta,
    ogImage: meta.ogImage || DEFAULT_OG_IMAGE
  };
}
