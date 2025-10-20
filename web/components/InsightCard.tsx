import Link from "next/link";
import Image from "next/image";
import { Calendar, Tag } from "lucide-react";

interface InsightCardProps {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  categories?: string[];
  image?: string;
  author?: string;
}

export function InsightCard({
  slug,
  title,
  excerpt,
  date,
  categories = [],
  image,
  author,
}: InsightCardProps) {
  const publishDate = new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Truncate excerpt to 150 chars
  const truncatedExcerpt = excerpt.length > 150 ? `${excerpt.substring(0, 150)}...` : excerpt;

  return (
    <Link href={`/insights/${slug}`}>
      <article className="group h-full flex flex-col rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
        {/* Featured Image */}
        {image && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-lg bg-slate-100">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-3 p-4 flex-1">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 2).map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                >
                  <Tag className="h-3 w-3" />
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 group-hover:text-blue-600">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="flex-1 line-clamp-3 text-sm text-slate-600">{truncatedExcerpt}</p>

          {/* Meta Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{publishDate}</span>
            </div>
            {author && <span className="font-medium text-slate-600">{author}</span>}
          </div>

          {/* Read More Link */}
          <div className="mt-2">
            <span className="text-xs font-semibold text-blue-600 group-hover:underline">
              Read Article →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
