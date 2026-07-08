import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Markdown } from "@/components/markdown";
import { getSitePage, getSitePageSlugs } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

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
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {page.title}
      </h1>
      {page.description && (
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          {page.description}
        </p>
      )}
      <div className="mt-10">
        <Markdown source={page.body} />
      </div>
    </div>
  );
}
