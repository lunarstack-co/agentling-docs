import { ArrowLeft, ArrowRight, ChevronRight, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { Markdown } from "@/components/markdown";
import { Toc } from "@/components/docs/toc";
import { getDocPage, getDocSections } from "@/lib/content";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { GITHUB_DOCS_URL } from "@/lib/site";
import { extractToc } from "@/lib/toc";

export const revalidate = 300;

interface DocPageParams {
  params: Promise<{ section: string; slug: string }>;
}

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

  return (
    <div className="grid grid-cols-1 gap-10 py-10 lg:py-14 lg:pl-12 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "TechArticle",
              headline: page.title,
              description: page.description,
              url: pageUrl,
              author: { "@type": "Person", name: "Folarin Akinloye" },
              isPartOf: {
                "@type": "WebSite",
                name: "agentling documentation",
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
      <article className="min-w-0 max-w-3xl">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
          <Link
            href="/docs"
            className="text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Docs
          </Link>
          <ChevronRight className="size-3.5 text-faint" aria-hidden />
          <span className="text-muted-foreground">{page.sectionTitle}</span>
          <ChevronRight className="size-3.5 text-faint" aria-hidden />
          <span className="font-medium text-foreground">{page.title}</span>
        </nav>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {page.title}
        </h1>
        {page.description && (
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            {page.description}
          </p>
        )}

        <div className="mt-8">
          <Markdown source={page.body} />
        </div>

        <div className="mt-10 border-t border-border pt-5">
          <a
            href={`${GITHUB_DOCS_URL}/blob/main/content/docs/${page.sectionSlug}/${page.slug}.md`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <PencilLine className="size-3.5" aria-hidden />
            Edit this page on GitHub
          </a>
        </div>

        <nav aria-label="Pagination" className="mt-6 grid gap-4 sm:grid-cols-2">
          {previous ? (
            <Link
              href={previous.href}
              className="group rounded-xl border border-border bg-card p-4 transition-colors duration-150 hover:border-border-strong"
            >
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ArrowLeft
                  className="size-3.5 transition-transform duration-150 group-hover:-translate-x-0.5"
                  aria-hidden
                />
                Previous
              </span>
              <span className="mt-1.5 block text-sm font-medium text-foreground">
                {previous.title}
              </span>
            </Link>
          ) : (
            <span aria-hidden />
          )}
          {next && (
            <Link
              href={next.href}
              className="group rounded-xl border border-border bg-card p-4 text-right transition-colors duration-150 hover:border-border-strong sm:col-start-2"
            >
              <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                Next
                <ArrowRight
                  className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="mt-1.5 block text-sm font-medium text-foreground">
                {next.title}
              </span>
            </Link>
          )}
        </nav>
      </article>

      <aside className="hidden xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
          <Toc entries={toc} />
        </div>
      </aside>
    </div>
  );
}
