export interface DocPageMeta {
  /** Short title: the H1, sidebar label, and breadcrumb. */
  title: string;
  slug: string;
  /** One-line lede shown under the H1. */
  description: string;
  order: number;
  /** Optional search-result title (50 to 60 chars). Falls back to title. */
  metaTitle?: string;
  /** Optional search-result description (120 to 155 chars). Falls back to description. */
  metaDescription?: string;
  /** ISO date of the last commit that touched the file. */
  modified: string;
}

export interface DocPage extends DocPageMeta {
  body: string;
  sectionSlug: string;
  sectionTitle: string;
  /** ISO date of the commit that created the file. */
  published: string;
}

export interface DocSection {
  title: string;
  slug: string;
  description: string;
  icon: string;
  order: number;
  pages: DocPageMeta[];
}

export interface ChangelogEntry {
  version: string;
  title: string;
  releaseDate: string;
  body: string;
  tags: string[];
}

export interface SitePage {
  title: string;
  slug: string;
  description: string;
  body: string;
  metaTitle?: string;
  metaDescription?: string;
  published: string;
  modified: string;
}
