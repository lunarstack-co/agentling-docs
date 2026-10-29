import MiniSearch from "minisearch";

import {
  getChangelog,
  getDocPage,
  getDocSections,
  getSitePage,
  getSitePageSlugs,
} from ".";

export interface SearchDoc {
  id: string;
  title: string;
  body: string;
  href: string;
  section: string;
}

let cachedIndex: MiniSearch<SearchDoc> | null = null;
let cachedDocs: SearchDoc[] | null = null;

export async function buildSearchDocs(): Promise<SearchDoc[]> {
  if (cachedDocs) return cachedDocs;

  const docs: SearchDoc[] = [];

  const sections = await getDocSections();
  for (const section of sections) {
    for (const pageMeta of section.pages) {
      const page = await getDocPage(pageMeta.slug);
      if (!page) continue;
      docs.push({
        id: `doc:${page.slug}`,
        title: page.title,
        body: page.body,
        href: `/docs/${section.slug}/${page.slug}`,
        section: section.title,
      });
    }
  }

  const releases = await getChangelog();
  for (const release of releases) {
    docs.push({
      id: `changelog:${release.version}`,
      title: `v${release.version} ${release.title}`.trim(),
      body: release.body,
      href: `/changelog#v${release.version}`,
      section: "Changelog",
    });
  }

  const pageSlugs = await getSitePageSlugs();
  for (const slug of pageSlugs) {
    const page = await getSitePage(slug);
    if (!page) continue;
    docs.push({
      id: `page:${slug}`,
      title: page.title,
      body: page.body,
      href: `/${slug}`,
      section: "Site",
    });
  }

  cachedDocs = docs;
  return docs;
}

export async function getSearchIndex(): Promise<MiniSearch<SearchDoc>> {
  if (cachedIndex) return cachedIndex;

  const docs = await buildSearchDocs();
  const miniSearch = new MiniSearch<SearchDoc>({
    fields: ["title", "body"],
    storeFields: ["title", "href", "section"],
    searchOptions: {
      boost: { title: 3 },
      fuzzy: 0.2,
      prefix: true,
    },
  });

  miniSearch.addAll(docs);
  cachedIndex = miniSearch;
  return miniSearch;
}

export async function search(query: string, limit = 8) {
  if (!query.trim()) return [];
  const index = await getSearchIndex();
  return index.search(query).slice(0, limit);
}
