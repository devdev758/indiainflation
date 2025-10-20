import Link from "next/link";
import { Calculator, Database, TrendingUp, ArrowRight } from "lucide-react";

interface RelatedLink {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "calculator" | "dataset" | "dashboard" | "insight";
}

interface RelatedLinksProps {
  currentPage?: string;
  limit?: number;
}

const relatedLinks: RelatedLink[] = [
  {
    href: "/inflation-calculator",
    title: "Inflation Calculator",
    description: "Convert historical rupee values to current prices using live CPI data",
    icon: <Calculator className="h-5 w-5" />,
    category: "calculator",
  },
  {
    href: "/datasets",
    title: "Datasets Explorer",
    description: "Browse and export historical CPI & WPI data from 1958-present",
    icon: <Database className="h-5 w-5" />,
    category: "dataset",
  },
  {
    href: "/cpi-dashboard",
    title: "CPI Dashboard",
    description: "Analyse state-wise inflation trends with interactive charts",
    icon: <TrendingUp className="h-5 w-5" />,
    category: "dashboard",
  },
  {
    href: "/compare",
    title: "CPI vs WPI Comparison",
    description: "Compare consumer and wholesale price indices side-by-side",
    icon: <TrendingUp className="h-5 w-5" />,
    category: "dashboard",
  },
  {
    href: "/insights",
    title: "More Insights",
    description: "Read educational articles on inflation and economic analysis",
    icon: <ArrowRight className="h-5 w-5" />,
    category: "insight",
  },
];

export function RelatedLinks({
  currentPage = "/insights",
  limit = 3,
}: RelatedLinksProps) {
  // Filter out current page and limit results
  const filtered = relatedLinks
    .filter((link) => link.href !== currentPage)
    .slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">Related Tools & Resources</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-lg border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 text-slate-600 group-hover:text-blue-600">
                {link.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600">
                  {link.title}
                </h3>
                <p className="mt-1 text-xs text-slate-600">{link.description}</p>
                <div className="mt-2 text-xs font-medium text-blue-600 group-hover:underline">
                  Explore →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function InsightRelatedLinks() {
  return <RelatedLinks currentPage="/insights" limit={3} />;
}

export function ArticleRelatedLinks({ slug }: { slug: string }) {
  return <RelatedLinks currentPage={`/insights/${slug}`} limit={4} />;
}
