import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyMarkdownButton } from "@/components/copy-markdown-button";
import { FeedbackWidget } from "@/components/docs/feedback-widget";
import { Toc, TocInline } from "@/components/docs/toc";
import { JsonLd } from "@/components/json-ld";
import { Markdown } from "@/components/markdown";
import { getDocPage, getDocSections } from "@/lib/content";
import { docArticleGraph, pageMetadata } from "@/lib/seo";
import { extractToc } from "@/lib/toc";

interface DocPageParams {
  params: Promise<{ section: string; slug: string }>;
}

/** Diátaxis mode per section, shown as one neutral eyebrow. */
const PAGE_KIND: Record<string, string> = {
  "getting-started": "Tutorial",
  "core-concepts": "Concept",
  guides: "Guide",
  reference: "Reference",
};

export async function generateStaticParams() {
  const sections = await getDocSections();
  return sections.flatMap((section) =>
    section.pages.map((page) => ({ section: section.slug, slug: page.slug })),
  );
}

export async function generateMetadata({
  params,
}: DocPageParams): Promise<Metadata> {
  const { slug } = await params;
  const page = await getDocPage(slug);
  if (!page) return {};
  return pageMetadata({
    kind: "doc",
    title: page.metaTitle ?? page.title,
    description: page.metaDescription ?? page.description,
    path: `/docs/${page.sectionSlug}/${page.slug}`,
    dates: { published: page.published, modified: page.modified },
  });
}

export default async function DocPage({ params }: DocPageParams) {
  const { section: sectionSlug, slug } = await params;
  const [page, sections] = await Promise.all([
    getDocPage(slug),
    getDocSections(),
  ]);

  if (!page || page.sectionSlug !== sectionSlug) notFound();

  const flat = sections.flatMap((section) =>
    section.pages.map((entry) => ({
      title: entry.title,
      href: `/docs/${section.slug}/${entry.slug}`,
      slug: entry.slug,
    })),
  );
  const index = flat.findIndex((entry) => entry.slug === slug);
  const previous = index > 0 ? flat[index - 1] : null;
  const next = index < flat.length - 1 ? flat[index + 1] : null;

  const toc = extractToc(page.body);
  const pagePath = `/docs/${page.sectionSlug}/${page.slug}`;
  const section = sections.find((entry) => entry.slug === page.sectionSlug);
  const sectionFirst = section?.pages[0];

  return (
    <div className="flex w-full min-w-0 justify-between gap-12">
      <JsonLd
        data={docArticleGraph({
          title: page.title,
          description: page.description,
          path: pagePath,
          published: page.published,
          modified: page.modified,
          crumbs: [
            { name: "Docs", path: "/docs/getting-started/introduction" },
            {
              name: page.sectionTitle,
              path: sectionFirst ? `/docs/${page.sectionSlug}/${sectionFirst.slug}` : pagePath,
            },
            { name: page.title, path: pagePath },
          ],
        })}
      />

      {/* Centred while the right-hand contents rail is hidden (below xl). */}
      <article className="mx-auto min-w-0 max-w-[680px] flex-1 xl:mx-0">
        <div className="flex items-center gap-2 text-ui text-fg-secondary">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2">
            <Link href="/docs/getting-started/introduction" className="inline-flex min-h-6 shrink-0 items-center transition-colors duration-150 hover:text-fg">
              Docs
            </Link>
            <span className="text-border-default" aria-hidden>/</span>
            <span className="truncate">{page.sectionTitle}</span>
          </nav>
          {PAGE_KIND[page.sectionSlug] && (
            <span className="eyebrow ml-auto shrink-0">{PAGE_KIND[page.sectionSlug]}</span>
          )}
        </div>

        <h1 className="mt-4 text-balance text-h1 font-semibold tracking-[-0.02em] text-fg">
          {page.title}
        </h1>

        {page.description && (
          <p className="mt-2.5 text-lede text-fg-secondary">{page.description}</p>
        )}

        <TocInline items={toc} />

        <div className="mt-5 flex items-center justify-end border-t border-border-subtle pt-2">
          <CopyMarkdownButton markdown={page.body} />
        </div>

        <div className="mt-4 min-w-0 max-w-full">
          <Markdown source={page.body} />
        </div>

        <div className="mt-12">
          <FeedbackWidget pageTitle={page.title} pagePath={pagePath} />
        </div>

        {(previous || next) && (
          <nav aria-label="Pagination" className="mt-8 grid gap-3 sm:grid-cols-2">
            {previous ? (
              <Link
                href={previous.href}
                className="grid gap-0.5 rounded-panel border border-border-subtle bg-raised px-3.5 py-3 transition-colors duration-150 hover:border-border-default"
              >
                <span className="eyebrow">Previous</span>
                <span className="text-ui font-medium text-fg">{previous.title}</span>
              </Link>
            ) : (
              <div />
            )}
            {next && (
              <Link
                href={next.href}
                className="grid gap-0.5 rounded-panel border border-border-subtle bg-raised px-3.5 py-3 text-right transition-colors duration-150 hover:border-border-default sm:col-start-2"
              >
                <span className="eyebrow">Next</span>
                <span className="text-ui font-medium text-fg">{next.title}</span>
              </Link>
            )}
          </nav>
        )}
      </article>

      <Toc items={toc} sectionSlug={page.sectionSlug} slug={page.slug} />
    </div>
  );
}
