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
    <div className="mx-auto w-full min-w-0 max-w-[760px] px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
      <h1 className="text-balance text-h1 font-semibold tracking-[-0.02em] text-fg">
        {page.title}
      </h1>
      {page.description && (
        <p className="mt-2.5 text-lede text-fg-secondary">{page.description}</p>
      )}
      <div className="mt-6 min-w-0 border-t border-border-subtle pt-6">
        <Markdown source={page.body} />
      </div>
    </div>
  );
}
