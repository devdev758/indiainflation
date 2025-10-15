export type ArticleDefinition = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
};

export type ArticleResult = {
  title: string;
  slug: string;
  url?: string;
  id?: number;
};

export type ArticlePublishSummary = {
  total: number;
  created: ArticleResult[];
  updated: ArticleResult[];
  skipped: ArticleResult[];
  failed: Array<{ title: string; slug: string; error: string }>;
};

export type WordPressPost = {
  id: number;
  link?: string;
  content?: { raw?: string };
};
