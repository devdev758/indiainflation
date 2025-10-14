import { Buffer } from "node:buffer";

type FetchPostsArgs = {
  per_page?: number;
  page?: number;
};

type RawEmbedded = {
  author?: Array<{ id: number; name?: string; slug?: string }>;
  "wp:featuredmedia"?: Array<{ id: number; source_url?: string; alt_text?: string }>;
  "wp:term"?: Array<Array<{ id: number; taxonomy?: string; name?: string; slug?: string }>>;
};

type RawPost = {
  id: number;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  _embedded?: RawEmbedded;
};

export type PostSummary = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  author?: string;
  featuredImage?: string;
  categories: Array<{ id: number; name: string; slug: string }>;
};

export type PostDetail = PostSummary & {
  content: string;
  readingTimeMinutes: number;
  tags: Array<{ id: number; name: string; slug: string }>;
  featuredImageAlt?: string;
};

const TTL_MS = 60 * 1000;

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

function getEnv(name: "WP_API_BASE" | "WP_ADMIN_USER" | "WP_APP_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing WordPress configuration: ${name}`);
  }
  return value;
}

function buildAuthHeader() {
  const user = getEnv("WP_ADMIN_USER");
  const password = getEnv("WP_APP_PASSWORD");
  const token = Buffer.from(`${user}:${password}`).toString("base64");
  return `Basic ${token}`;
}

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function setCached<T>(key: string, value: T) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + TTL_MS
  });
}

function getBaseUrls() {
  const raw = getEnv("WP_API_BASE");
  const parts = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    throw new Error("WP_API_BASE must contain at least one URL");
  }
  return parts;
}

function buildUrl(baseUrl: string, path: string, searchParams?: Record<string, string | number | undefined>) {
  const normalizedPath = path.replace(/^\/+/, "");
  let url: URL;

  if (baseUrl.includes("rest_route")) {
    url = new URL(baseUrl);
    const restRouteBase = url.searchParams.get("rest_route") ?? "/";
    const combined = `${restRouteBase.replace(/\/$/, "")}/${normalizedPath}`.replace(/\/+/g, "/");
    url.searchParams.set("rest_route", combined.startsWith("/") ? combined : `/${combined}`);
  } else {
    url = new URL(normalizedPath, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  }

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url;
}

async function wpFetch<T>(path: string, searchParams?: Record<string, string | number | undefined>): Promise<T> {
  const bases = getBaseUrls();
  let lastError: unknown;

  for (const baseUrl of bases) {
    const url = buildUrl(baseUrl, path, searchParams);
    const cacheKey = url.toString();

    const cached = getCached<T>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(url.toString(), {
        headers: {
          Authorization: buildAuthHeader(),
          Accept: "application/json"
        },
        next: { revalidate: 0 }
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`WordPress request failed (${response.status}): ${text}`);
      }

      const data = (await response.json()) as T;
      setCached(cacheKey, data);
      return data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("All WordPress API base URLs failed");
}

function extractTerms(raw?: RawEmbedded["wp:term"]): {
  categories: Array<{ id: number; name: string; slug: string }>;
  tags: Array<{ id: number; name: string; slug: string }>;
} {
  const categories: Array<{ id: number; name: string; slug: string }> = [];
  const tags: Array<{ id: number; name: string; slug: string }> = [];

  if (!raw) return { categories, tags };

  raw.forEach((group) => {
    group.forEach((term) => {
      const item = {
        id: term.id,
        name: term.name ?? "",
        slug: term.slug ?? ""
      };
      if (term.taxonomy === "category") {
        categories.push(item);
      } else if (term.taxonomy === "post_tag") {
        tags.push(item);
      }
    });
  });

  return {
    categories: categories.filter((category) => category.name.length > 0),
    tags: tags.filter((tag) => tag.name.length > 0)
  };
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateReadingTimeMinutes(html: string): number {
  const plainText = stripHtml(html);
  const words = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function mapPost(raw: RawPost): PostDetail {
  const authorName = raw._embedded?.author?.[0]?.name ?? undefined;
  const featured = raw._embedded?.["wp:featuredmedia"]?.[0];
  const { categories, tags } = extractTerms(raw._embedded?.["wp:term"]);

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title?.rendered ?? "",
    excerpt: raw.excerpt?.rendered ?? "",
    content: raw.content?.rendered ?? "",
    date: raw.date,
    author: authorName,
    featuredImage: featured?.source_url,
    featuredImageAlt: featured?.alt_text,
    categories,
    tags,
    readingTimeMinutes: estimateReadingTimeMinutes(raw.content?.rendered ?? "")
  };
}

export async function fetchPosts({ per_page = 10, page = 1 }: FetchPostsArgs = {}): Promise<PostSummary[]> {
  const posts = await wpFetch<RawPost[]>("wp/v2/posts", {
    per_page,
    page,
    status: "publish",
    _embed: "author,wp:featuredmedia,wp:term"
  });
  return posts.map((post) => {
    const mapped = mapPost(post);
    return {
      id: mapped.id,
      slug: mapped.slug,
      title: mapped.title,
      excerpt: mapped.excerpt,
      date: mapped.date,
      author: mapped.author,
      featuredImage: mapped.featuredImage,
      categories: mapped.categories
    } satisfies PostSummary;
  });
}

export async function fetchPostBySlug(slug: string): Promise<PostDetail | null> {
  if (!slug) {
    throw new Error("fetchPostBySlug requires a slug");
  }

  const results = await wpFetch<RawPost[]>("wp/v2/posts", {
    per_page: 1,
    page: 1,
    status: "publish",
    slug,
    _embed: "author,wp:featuredmedia,wp:term"
  });

  if (!results.length) {
    return null;
  }

  return mapPost(results[0]);
}

export async function fetchRelatedPosts(options: {
  categories: number[];
  excludeId: number;
  per_page?: number;
}): Promise<PostSummary[]> {
  const { categories, excludeId, per_page = 3 } = options;
  if (!categories.length) {
    return [];
  }

  const posts = await wpFetch<RawPost[]>("wp/v2/posts", {
    per_page,
    page: 1,
    status: "publish",
    categories: categories.join(","),
    exclude: excludeId,
    _embed: "author,wp:featuredmedia,wp:term"
  });

  return posts.map((post) => {
    const mapped = mapPost(post);
    return {
      id: mapped.id,
      slug: mapped.slug,
      title: mapped.title,
      excerpt: mapped.excerpt,
      date: mapped.date,
      author: mapped.author,
      featuredImage: mapped.featuredImage,
      categories: mapped.categories
    } satisfies PostSummary;
  });
}

export function __clearWpClientCache() {
  cache.clear();
}
