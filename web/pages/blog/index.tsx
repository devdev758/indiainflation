import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import { fetchPosts, type PostSummary } from "@/lib/wpClient";

type Props = {
  posts: PostSummary[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const posts = await fetchPosts({ per_page: 20, page: 1 });
    return {
      props: { posts },
      revalidate: 60
    };
  } catch (error) {
    console.error("Failed to fetch blog posts", error);
    return {
      props: { posts: [] },
      revalidate: 60
    };
  }
};

export default function BlogIndexPage({ posts }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Head>
        <title>Guides &amp; Analysis | India Inflation</title>
        <meta
          name="description"
          content="Read our latest guides on consumer price trends, food inflation insights, and how to use the India Inflation Calculator."
        />
      </Head>
      <h1 className="mb-8 text-4xl font-bold">Guides &amp; Analysis</h1>
      {posts.length === 0 ? (
        <p className="text-gray-600">No published posts yet. Please check back soon.</p>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => (
            <li key={post.id} className="rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-2xl font-semibold">
                <Link href={`/${post.slug}`} className="text-blue-600 hover:underline">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-sm text-gray-500">
                {new Date(post.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
              <div
                className="prose mt-4 max-w-none text-gray-700"
                dangerouslySetInnerHTML={{ __html: post.excerpt }}
              />
              <div className="mt-4">
                <Link href={`/${post.slug}`} className="font-medium text-blue-600 hover:underline">
                  Read more →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
