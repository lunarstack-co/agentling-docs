import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PostCover } from "@/components/blog/post-cover";
import { getBlogPosts } from "@/lib/content";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Release announcements and technical deep dives from the agentling project.",
};

export default async function BlogIndexPage() {
  const posts = await getBlogPosts();
  const featured = posts.find((post) => post.featured) ?? posts[0];
  const rest = posts.filter((post) => post.slug !== featured?.slug);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="font-mono text-xs font-semibold tracking-wider text-accent uppercase">
        Blog
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        News and engineering notes
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Release announcements, design write-ups, and honest notes from
        building a small agent framework.
      </p>

      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="group mt-10 grid gap-6 rounded-2xl border border-border bg-card p-6 transition-colors duration-150 hover:border-border-strong md:grid-cols-[1.1fr_1fr] md:p-8"
        >
          <div className="flex flex-col justify-center">
            <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-medium text-accent">
                Featured
              </span>
              {formatDate(featured.publishDate)} · {featured.readingMinutes} min
              read
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
              {featured.title}
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {featured.excerpt}
            </p>
            <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
              Read the announcement
              <ArrowRight
                className="size-4 transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden
              />
            </p>
          </div>
          <PostCover slug={featured.slug} className="min-h-48" />
        </Link>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {rest.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 transition-colors duration-150 hover:border-border-strong"
          >
            <PostCover slug={post.slug} className="h-36" />
            <p className="mt-5 font-mono text-xs text-muted-foreground">
              {formatDate(post.publishDate)} · {post.readingMinutes} min read
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-foreground">
              {post.title}
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>
            <p className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
