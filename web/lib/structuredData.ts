const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://indiainflation.com";

export interface StructuredData {
  "@context": string;
  "@type": string;
  [key: string]: any;
}

export function generateOrganizationSchema(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Indiainflation",
    url: SITE_URL,
    logo: `${SITE_URL.replace(/\/$/, "")}/logo.png`,
    description: "India's trusted inflation intelligence platform with live CPI dashboards and analytics.",
    sameAs: [
      "https://twitter.com/indiainflation",
      "https://www.linkedin.com/company/indiainflation",
      "https://www.instagram.com/indiainflation"
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "support@indiainflation.com",
      url: `${SITE_URL}/contact`
    },
    founders: [
      {
        "@type": "Person",
        name: "Indiainflation Team"
      }
    ]
  };
}

export function generateWebsiteSchema(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Indiainflation",
    url: SITE_URL,
    description: "Explore India's inflation trends, convert historical prices, and read the latest CPI analysis.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/compare?search={search_term}`,
      "query-input": "required name=search_term"
    },
    publisher: {
      "@type": "Organization",
      name: "Indiainflation",
      url: SITE_URL
    }
  };
}

export function generateArticleSchema(data: {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  author?: string;
  image?: string;
  url: string;
}): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.headline,
    description: data.description,
    image: data.image || `${SITE_URL.replace(/\/$/, "")}/og-default.png`,
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    author: {
      "@type": "Organization",
      name: data.author || "Indiainflation"
    },
    publisher: {
      "@type": "Organization",
      name: "Indiainflation",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL.replace(/\/$/, "")}/logo.png`
      }
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": data.url
    }
  };
}

export function generateDatasetSchema(data: {
  name: string;
  description: string;
  url: string;
  keywords?: string[];
  measurementTechnique?: string;
  spatialCoverage?: string;
  dateModified?: string;
}): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: data.name,
    description: data.description,
    url: data.url,
    keywords: data.keywords || ["India", "inflation", "CPI", "economic data"],
    measurementTechnique: data.measurementTechnique || "Consumer Price Index",
    spatialCoverage: data.spatialCoverage || "IN",
    dateModified: data.dateModified || new Date().toISOString(),
    publisher: {
      "@type": "Organization",
      name: "Indiainflation",
      url: SITE_URL
    },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: ["CSV", "JSON", "Excel"],
      url: data.url
    }
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

export function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data);
}

export function renderStructuredDataScript(data: StructuredData): string {
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

export function generateFinancialToolSchema(data: {
  name: string;
  description: string;
  url: string;
  dataRange?: string;
}): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: data.name,
    description: data.description,
    url: data.url,
    applicationCategory: "FinanceApplication",
    softwareVersion: "1.0",
    author: {
      "@type": "Organization",
      name: "Indiainflation",
      url: SITE_URL
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
      availability: "https://schema.org/OnlineOnly"
    },
    potentialAction: {
      "@type": "UseAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: data.url,
        actionPlatform: ["DesktopWebPlatform", "MobileWebPlatform"]
      }
    },
    dateModified: new Date().toISOString(),
    ...(data.dataRange && { description: `${data.description}. Data coverage: ${data.dataRange}` })
  };
}

export function generateDatasetSchema(data: {
  name: string;
  description: string;
  url: string;
  keywords?: string[];
}): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: data.name,
    description: data.description,
    url: data.url,
    keywords: data.keywords || ["CPI", "WPI", "inflation", "India", "economic data"],
    publisher: {
      "@type": "Organization",
      name: "Indiainflation",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL.replace(/\/$/, "")}/logo.png`
      }
    },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: ["CSV", "JSON"],
      url: data.url
    },
    spatialCoverage: {
      "@type": "Place",
      name: "India"
    },
    temporalCoverage: "1958-01-01/2024-12-31",
    author: {
      "@type": "Organization",
      name: "Ministry of Statistics and Programme Implementation"
    },
    dateModified: new Date().toISOString(),
    isAccessibleForFree: true
  };
}
