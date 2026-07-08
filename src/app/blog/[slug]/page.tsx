import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Markdown } from "@/components/markdown";
import { getBlogPost, getBlogPosts } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

interface BlogPostParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostParams): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishDate,
      authors: [post.authorName],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostParams) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All posts
      </Link>

      <header className="mt-8">
        <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
          <time dateTime={post.publishDate}>{formatDate(post.publishDate)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-[2.6rem] sm:leading-[1.15]">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {post.excerpt}
        </p>
        <div className="mt-6 flex items-center justify-between gap-4 border-y border-border py-4">
          <p className="text-sm">
            <span className="font-medium text-foreground">{post.authorName}</span>
            <span className="block text-xs text-muted-foreground">
              Creator of agentling
            </span>
          </p>
          <p className="flex flex-wrap justify-end gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </p>
        </div>
      </header>

      <div className="mt-10">
        <Markdown source={post.body} />
      </div>
    </article>
  );
}
