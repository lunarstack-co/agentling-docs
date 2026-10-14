export interface DocPageMeta {
  title: string;
  slug: string;
  description: string;
  order: number;
}

export interface DocPage extends DocPageMeta {
  body: string;
  sectionSlug: string;
  sectionTitle: string;
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
}
