import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Markdown } from "@/components/markdown";
import { getSitePage, getSitePageSlugs } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

interface SitePageParams {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getSitePageSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: SitePageParams): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSitePage(slug);
  if (!page) return {};
  return pageMetadata({
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
  });
}

export default async function StandaloneSitePage({ params }: SitePageParams) {
  const { slug } = await params;
  const page = await getSitePage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12 min-w-0 overflow-hidden">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
        {page.title}
      </h1>
      {page.description && (
        <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {page.description}
        </p>
      )}
      <div className="mt-8 border-t border-border pt-6 min-w-0 break-words">
        <Markdown source={page.body} />
      </div>
    </div>
  );
}
