import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { Markdown } from "@/components/markdown";
import { getSitePage, getSitePageSlugs } from "@/lib/content";
import { pageMetadata, webPageGraph } from "@/lib/seo";

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
    kind: "page",
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? page.description,
    path: `/${page.slug}`,
    dates: { published: page.published, modified: page.modified },
  });
}

export default async function StandaloneSitePage({ params }: SitePageParams) {
  const { slug } = await params;
  const page = await getSitePage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto w-full min-w-0 max-w-[760px] px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
      <JsonLd
        data={webPageGraph({
          title: page.title,
          description: page.description,
          path: `/${page.slug}`,
          modified: page.modified,
          crumbs: [
            { name: "Docs", path: "/docs/getting-started/introduction" },
            { name: page.title, path: `/${page.slug}` },
          ],
        })}
      />
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
