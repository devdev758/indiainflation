import Head from "next/head";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";

import { fetchPostBySlug, fetchPosts, type PostDetail } from "@/lib/wpClient";

type Props = {
  post: PostDetail;
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const posts = await fetchPosts({ per_page: 50, page: 1 });
    return {
      paths: posts.map((post) => ({ params: { slug: post.slug } })),
      fallback: "blocking"
    };
  } catch (error) {
    console.error("Failed to build blog paths", error);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = typeof params?.slug === "string" ? params.slug : "";

  try {
    const post = await fetchPostBySlug(slug);
    if (!post) {
      return { notFound: true, revalidate: 60 };
    }

    return {
      props: { post },
      revalidate: 300
    };
  } catch (error) {
    console.error(`Failed to fetch post for slug ${slug}`, error);
    return { notFound: true, revalidate: 60 };
  }
};

export default function BlogPostPage({ post }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <Head>
        <title>{post.title} | India Inflation</title>
        <meta name="description" content={post.excerpt.replace(/<[^>]+>/g, "").slice(0, 155)} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt.replace(/<[^>]+>/g, "").slice(0, 200)} />
      </Head>
      <header className="mb-8">
        <h1 className="text-4xl font-bold">{post.title}</h1>
        <p className="mt-3 text-sm text-gray-500">
          {new Date(post.date).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}
        </p>
      </header>
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
