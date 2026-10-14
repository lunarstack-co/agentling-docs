import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CopyMarkdownButton } from "@/components/copy-markdown-button";
import { FeedbackWidget } from "@/components/docs/feedback-widget";
import { Toc } from "@/components/docs/toc";
import { JsonLd } from "@/components/json-ld";
import { Markdown } from "@/components/markdown";
import { getDocPage, getDocSections } from "@/lib/content";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { AUTHOR_JSON_LD } from "@/lib/site";
import { extractToc } from "@/lib/toc";

interface DocPageParams {
  params: Promise<{ section: string; slug: string }>;
}

const TEMPLATE_BADGES: Record<string, { label: string; color: string }> = {
  "getting-started": { label: "Tutorial", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  "core-concepts": { label: "Concept", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  guides: { label: "How-To Guide", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  reference: { label: "API Reference", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
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
    title: page.title,
    description: page.description,
    path: `/docs/${page.sectionSlug}/${page.slug}`,
    ogType: "article",
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
  const pageUrl = absoluteUrl(`/docs/${page.sectionSlug}/${page.slug}`);
  const templateBadge = TEMPLATE_BADGES[page.sectionSlug] ?? { label: "Guide", color: "bg-muted text-muted-foreground border-border" };

  return (
    <div className="flex w-full justify-between gap-8 lg:gap-12 min-w-0">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "TechArticle",
              headline: page.title,
              description: page.description,
              url: pageUrl,
              author: AUTHOR_JSON_LD,
              isPartOf: {
                "@type": "WebSite",
                name: "Agentling Documentation",
                url: absoluteUrl("/docs"),
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Docs", item: absoluteUrl("/docs") },
                { "@type": "ListItem", position: 2, name: page.sectionTitle },
                { "@type": "ListItem", position: 3, name: page.title, item: pageUrl },
              ],
            },
          ],
        }}
      />

      {/* Centre Column: max-w-[720px] for prose, code breaks wider up to 860px */}
      <article className="min-w-0 max-w-full lg:max-w-[720px] flex-1 pb-16">
        {/* Breadcrumb + Diataxis badge */}
        <div className="flex items-center justify-between gap-2 text-xs mb-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-muted-foreground truncate pr-2">
            <Link href="/docs" className="hover:text-foreground transition-colors shrink-0">
              Docs
            </Link>
            <span className="text-border-strong shrink-0">/</span>
            <span className="truncate">{page.sectionTitle}</span>
          </nav>

          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium border shrink-0 ${templateBadge.color}`}>
            {templateBadge.label}
          </span>
        </div>

        {/* H1 Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-tight">
          {page.title}
        </h1>

        {/* One-sentence summary in larger, muted text */}
        {page.description && (
          <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted-foreground font-normal">
            {page.description}
          </p>
        )}

        {/* Action Header Strip */}
        <div className="mt-6 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="font-mono text-[11px] text-faint">Python 3.11+ &bull; MIT</span>
          <CopyMarkdownButton markdown={page.body} />
        </div>

        {/* Markdown Content */}
        <div className="mt-6 min-w-0 max-w-full overflow-hidden">
          <Markdown source={page.body} />
        </div>

        {/* Was this helpful? Widget */}
        <div className="mt-14 pt-8 border-t border-border">
          <FeedbackWidget />
        </div>

        {/* Prev / Next within section */}
        {(previous || next) && (
          <nav
            aria-label="Pagination"
            className="mt-8 grid gap-4 border-t border-border pt-6 sm:grid-cols-2 text-xs font-sans"
          >
            {previous ? (
              <Link
                href={previous.href}
                className="group flex flex-col rounded border border-border p-3.5 hover:border-foreground/30 transition-all bg-card"
              >
                <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                  <ArrowLeft className="size-3" />
                  Previous
                </span>
                <span className="mt-1 font-medium text-foreground">
                  {previous.title}
                </span>
              </Link>
            ) : <div />}

            {next && (
              <Link
                href={next.href}
                className="group flex flex-col rounded border border-border p-3.5 text-right hover:border-foreground/30 transition-all sm:col-start-2 bg-card"
              >
                <span className="text-muted-foreground flex items-center justify-end gap-1 text-[11px]">
                  Next
                  <ArrowRight className="size-3" />
                </span>
                <span className="mt-1 font-medium text-foreground">
                  {next.title}
                </span>
              </Link>
            )}
          </nav>
        )}
      </article>

      {/* Right Rail: 220px TOC + Quiet Trust Signals */}
      <Toc items={toc} sectionSlug={page.sectionSlug} slug={page.slug} />
    </div>
  );
}
