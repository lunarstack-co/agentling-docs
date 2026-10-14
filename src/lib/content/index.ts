import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

import type {
  ChangelogEntry,
  DocPage,
  DocSection,
  SitePage,
} from "./types";

/**
 * The site's data layer. All content lives as markdown with frontmatter in
 * /content and is read from the filesystem at build time.
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

export async function getDocSections(): Promise<DocSection[]> {
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

export async function getDocPage(slug: string): Promise<DocPage | null> {
  const sections = await getDocSections();
  for (const section of sections) {
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

export async function getChangelog(): Promise<ChangelogEntry[]> {
  const changelogDir = path.join(CONTENT_DIR, "changelog");
  return markdownFiles(changelogDir)
    .map((file) => {
      const entry = readMarkdown(file);
      return {
        version: String(entry.version),
        title: String(entry.title ?? ""),
        releaseDate: toIsoString(entry.releaseDate),
        body: entry.body,
        tags: (entry.tags as string[]) ?? [],
      };
    })
    .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }));
}

export async function getSitePage(slug: string): Promise<SitePage | null> {
  const file = path.join(CONTENT_DIR, "pages", `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const page = readMarkdown(file);
  return {
    title: String(page.title),
    slug,
    description: String(page.description ?? ""),
    body: page.body,
  };
}

export async function getSitePageSlugs(): Promise<string[]> {
  const pagesDir = path.join(CONTENT_DIR, "pages");
  return markdownFiles(pagesDir).map((file) =>
    path.basename(file).replace(/\.md$/, ""),
  );
}
