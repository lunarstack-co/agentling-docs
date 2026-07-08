import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import type {
  BlogPost,
  ChangelogEntry,
  DocPage,
  DocSection,
  SitePage,
} from "./types";

/**
 * Bundled seed content, read from /content. It is the source the Hygraph
 * seed script pushes to the CMS, and the transparent fallback the site
 * renders from when no CMS credentials are configured, so the project runs
 * with zero environment variables.
 */

const CONTENT_DIR = path.join(process.cwd(), "content");

function readMarkdown(file: string): Record<string, unknown> & { body: string } {
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { ...data, body: content.trim() };
}

function markdownFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(dir, name));
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === "string" ? value : "";
}

function byOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order;
}

export function seedDocSections(): DocSection[] {
  const docsDir = path.join(CONTENT_DIR, "docs");
  return fs
    .readdirSync(docsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const sectionDir = path.join(docsDir, entry.name);
      const section = readMarkdown(path.join(sectionDir, "_section.md"));
      const pages = markdownFiles(sectionDir)
        .filter((file) => path.basename(file) !== "_section.md")
        .map((file) => {
          const page = readMarkdown(file);
          return {
            title: String(page.title),
            slug: String(page.slug),
            description: String(page.description ?? ""),
            order: Number(page.order ?? 0),
          };
        })
        .sort(byOrder);
      return {
        title: String(section.title),
        slug: String(section.slug),
        description: String(section.description ?? ""),
        icon: String(section.icon ?? "book-open"),
        order: Number(section.order ?? 0),
        pages,
      };
    })
    .sort(byOrder);
}

export function seedDocPage(slug: string): DocPage | null {
  for (const section of seedDocSections()) {
    const sectionDir = path.join(CONTENT_DIR, "docs", section.slug);
    for (const file of markdownFiles(sectionDir)) {
      if (path.basename(file) === "_section.md") continue;
      const page = readMarkdown(file);
      if (page.slug === slug) {
        return {
          title: String(page.title),
          slug,
          description: String(page.description ?? ""),
          order: Number(page.order ?? 0),
          body: page.body,
          sectionSlug: section.slug,
          sectionTitle: section.title,
        };
      }
    }
  }
  return null;
}

export function seedBlogPosts(): BlogPost[] {
  return markdownFiles(path.join(CONTENT_DIR, "blog"))
    .map((file) => {
      const post = readMarkdown(file);
      return {
        title: String(post.title),
        slug: String(post.slug),
        excerpt: String(post.excerpt ?? ""),
        body: post.body,
        publishDate: toIsoString(post.publishDate),
        authorName: String(post.authorName ?? ""),
        tags: (post.tags as string[]) ?? [],
        featured: Boolean(post.featured),
        readingMinutes: Number(post.readingMinutes ?? 5),
      };
    })
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
}

export function seedChangelog(): ChangelogEntry[] {
  return markdownFiles(path.join(CONTENT_DIR, "changelog"))
    .map((file) => {
      const entry = readMarkdown(file);
      return {
        version: String(entry.version),
        title: String(entry.title ?? ""),
        releaseDate: toIsoString(entry.releaseDate).slice(0, 10),
        body: entry.body,
        tags: (entry.tags as string[]) ?? [],
      };
    })
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

export function seedSitePages(): SitePage[] {
  return markdownFiles(path.join(CONTENT_DIR, "pages")).map((file) => {
    const page = readMarkdown(file);
    return {
      title: String(page.title),
      slug: String(page.slug),
      description: String(page.description ?? ""),
      body: page.body,
    };
  });
}
