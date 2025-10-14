import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType } from "next";

import InflationConverter from "@/components/InflationConverter";
import LatestCPIWidget from "@/components/LatestCPIWidget";
import { fetchPosts, type PostSummary } from "@/lib/wpClient";

type HomeProps = {
  posts: PostSummary[];
};

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const posts = await fetchPosts({ per_page: 3, page: 1 });
    return {
      props: { posts },
      revalidate: 300
    };
  } catch (error) {
    console.error("homepage posts fetch failed", error);
    return {
      props: { posts: [] },
      revalidate: 300
    };
  }
};

export default function Home({ posts }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Indiainflation</title>
        <meta name="description" content="India inflation insights and calculators" />
      </Head>
      <section className="mx-auto max-w-4xl space-y-10 px-4 pb-12">
        <header className="space-y-2 pt-6">
          <h1 className="text-3xl font-bold text-slate-900">Indiainflation Dashboard</h1>
          <p className="text-slate-600">
            Convert historical prices, explore item inflation series, and stay up to date with the latest CPI print.
          </p>
        </header>
        <LatestCPIWidget />
        <InflationConverter />
        <section className="space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Latest analysis</h2>
          </header>
          {posts.length === 0 ? (
            <p className="text-slate-600">No published posts yet. Check back soon.</p>
          ) : (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li key={post.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-semibold text-slate-900">
                      <Link href={`/${post.slug}`} className="hover:underline">
                        {post.title}
                      </Link>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {new Date(post.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </p>
                    <div
                      className="prose prose-sm max-w-none text-slate-600"
                      dangerouslySetInnerHTML={{ __html: post.excerpt }}
                    />
                    <div>
                      <Link href={`/${post.slug}`} className="text-sm font-medium text-indigo-600 hover:underline">
                        Read more →
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </>
  );
}
