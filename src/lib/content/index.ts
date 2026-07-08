import { hygraphRequest } from "./hygraph";
import {
  seedBlogPosts,
  seedChangelog,
  seedDocPage,
  seedDocSections,
  seedSitePages,
} from "./seed";
import type {
  BlogPost,
  BlogPostMeta,
  ChangelogEntry,
  DocPage,
  DocSection,
  SitePage,
} from "./types";

/**
 * The single data layer for the site. Every getter asks Hygraph first and
 * transparently falls back to the bundled seed content when the CMS is not
 * configured, unreachable, or returns nothing. Pages cache results through
 * ISR (`export const revalidate`), so these run at build and revalidation
 * time, not on every request.
 */

const DOC_PAGE_META = `title slug description order`;
const BLOG_META = `title slug excerpt publishDate authorName tags featured readingMinutes`;

/**
 * Short-lived in-process memo. Static generation renders many pages that
 * need the same lists (sidebar, search index, pagers); memoizing keeps a
 * build from hammering the CMS rate limit with identical queries.
 */
const memoCache = new Map<string, { at: number; value: Promise<unknown> }>();
const MEMO_TTL_MS = 60_000;

function memo<T>(key: string, load: () => Promise<T>): Promise<T> {
  const hit = memoCache.get(key);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) {
    return hit.value as Promise<T>;
  }
  const value = load();
  memoCache.set(key, { at: Date.now(), value });
  return value;
}

export function getDocSections(): Promise<DocSection[]> {
  return memo("docSections", loadDocSections);
}

async function loadDocSections(): Promise<DocSection[]> {
  const data = await hygraphRequest<{
    docSections: (Omit<DocSection, "pages"> & {
      pages: { title: string; slug: string; description: string | null; order: number | null }[];
    })[];
  }>(
    `query DocSections {
      docSections(orderBy: order_ASC, first: 100) {
        title slug description icon order
        pages(orderBy: order_ASC, first: 100) { ${DOC_PAGE_META} }
      }
    }`,
  );

  if (!data || data.docSections.length === 0) return seedDocSections();

  return data.docSections.map((section) => ({
    ...section,
    description: section.description ?? "",
    icon: section.icon ?? "book-open",
    order: section.order ?? 0,
    pages: section.pages.map((page) => ({
      ...page,
      description: page.description ?? "",
      order: page.order ?? 0,
    })),
  }));
}

export async function getDocPage(slug: string): Promise<DocPage | null> {
  const data = await hygraphRequest<{
    docPage: {
      title: string;
      slug: string;
      description: string | null;
      order: number | null;
      body: string | null;
      section: { slug: string; title: string } | null;
    } | null;
  }>(
    `query DocPage($slug: String!) {
      docPage(where: { slug: $slug }) {
        ${DOC_PAGE_META} body
        section { slug title }
      }
    }`,
    { slug },
  );

  if (!data) return seedDocPage(slug);
  if (!data.docPage) return null;

  return {
    title: data.docPage.title,
    slug: data.docPage.slug,
    description: data.docPage.description ?? "",
    order: data.docPage.order ?? 0,
    body: data.docPage.body ?? "",
    sectionSlug: data.docPage.section?.slug ?? "",
    sectionTitle: data.docPage.section?.title ?? "",
  };
}

export function getBlogPosts(): Promise<BlogPostMeta[]> {
  return memo("blogPosts", loadBlogPosts);
}

async function loadBlogPosts(): Promise<BlogPostMeta[]> {
  const data = await hygraphRequest<{ blogPosts: BlogPostMeta[] }>(
    `query BlogPosts {
      blogPosts(orderBy: publishDate_DESC, first: 100) { ${BLOG_META} }
    }`,
  );

  if (!data || data.blogPosts.length === 0) {
    return seedBlogPosts().map((post) => {
      const meta: BlogPostMeta & { body?: string } = { ...post };
      delete meta.body;
      return meta;
    });
  }
  return data.blogPosts.map(normalizePost);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const data = await hygraphRequest<{ blogPost: (BlogPost & { body: string | null }) | null }>(
    `query BlogPost($slug: String!) {
      blogPost(where: { slug: $slug }) { ${BLOG_META} body }
    }`,
    { slug },
  );

  if (!data) return seedBlogPosts().find((post) => post.slug === slug) ?? null;
  if (!data.blogPost) return null;
  return { ...normalizePost(data.blogPost), body: data.blogPost.body ?? "" };
}

export function getChangelog(): Promise<ChangelogEntry[]> {
  return memo("changelog", loadChangelog);
}

async function loadChangelog(): Promise<ChangelogEntry[]> {
  const data = await hygraphRequest<{ changelogEntries: ChangelogEntry[] }>(
    `query Changelog {
      changelogEntries(orderBy: releaseDate_DESC, first: 100) {
        version title releaseDate body tags
      }
    }`,
  );

  if (!data || data.changelogEntries.length === 0) return seedChangelog();
  return data.changelogEntries.map((entry) => ({
    ...entry,
    title: entry.title ?? "",
    body: entry.body ?? "",
    tags: entry.tags ?? [],
  }));
}

export async function getSitePage(slug: string): Promise<SitePage | null> {
  const data = await hygraphRequest<{ sitePage: SitePage | null }>(
    `query SitePage($slug: String!) {
      sitePage(where: { slug: $slug }) { title slug description body }
    }`,
    { slug },
  );

  if (!data) return seedSitePages().find((page) => page.slug === slug) ?? null;
  if (!data.sitePage) return null;
  return {
    ...data.sitePage,
    description: data.sitePage.description ?? "",
    body: data.sitePage.body ?? "",
  };
}

export async function getSitePageSlugs(): Promise<string[]> {
  const data = await hygraphRequest<{ sitePages: { slug: string }[] }>(
    `query SitePageSlugs { sitePages(first: 100) { slug } }`,
  );
  if (!data || data.sitePages.length === 0) {
    return seedSitePages().map((page) => page.slug);
  }
  return data.sitePages.map((page) => page.slug);
}

function normalizePost<T extends BlogPostMeta>(post: T): T {
  return {
    ...post,
    excerpt: post.excerpt ?? "",
    authorName: post.authorName ?? "",
    tags: post.tags ?? [],
    featured: post.featured ?? false,
    readingMinutes: post.readingMinutes ?? 5,
  };
}
