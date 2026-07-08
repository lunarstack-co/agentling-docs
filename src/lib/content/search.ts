import {
  getBlogPosts,
  getBlogPost,
  getChangelog,
  getDocPage,
  getDocSections,
  getSitePage,
  getSitePageSlugs,
} from ".";

export interface SearchDocument {
  id: string;
  href: string;
  title: string;
  description: string;
  group: string;
  headings: string;
  body: string;
}

/**
 * Reduces markdown to plain searchable text: code fence markers, link
 * syntax, and emphasis go away while the words (including identifiers
 * inside code) stay.
 */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^```.*$/gm, " ")
    .replace(/^#{1,6}\s+/gm, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadings(markdown: string): string {
  return markdown
    .split("\n")
    .filter((line) => /^#{2,4}\s/.test(line))
    .map((line) => line.replace(/^#{2,4}\s+/, "").replace(/[`*]/g, ""))
    .join(" ");
}

/** Builds the corpus served at /search-index.json and used by the Cmd+K dialog. */
export async function getSearchDocuments(): Promise<SearchDocument[]> {
  const [sections, posts, releases, sitePageSlugs] = await Promise.all([
    getDocSections(),
    getBlogPosts(),
    getChangelog(),
    getSitePageSlugs(),
  ]);

  const documents: SearchDocument[] = [];

  for (const section of sections) {
    for (const meta of section.pages) {
      const page = await getDocPage(meta.slug);
      if (!page) continue;
      documents.push({
        id: `docs:${page.slug}`,
        href: `/docs/${section.slug}/${page.slug}`,
        title: page.title,
        description: page.description,
        group: section.title,
        headings: extractHeadings(page.body),
        body: stripMarkdown(page.body),
      });
    }
  }

  for (const meta of posts) {
    const post = await getBlogPost(meta.slug);
    if (!post) continue;
    documents.push({
      id: `blog:${post.slug}`,
      href: `/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      group: "Blog",
      headings: extractHeadings(post.body),
      body: stripMarkdown(post.body),
    });
  }

  for (const release of releases) {
    documents.push({
      id: `changelog:${release.version}`,
      href: "/changelog",
      title: `v${release.version} ${release.title}`.trim(),
      description: `Released ${release.releaseDate}`,
      group: "Changelog",
      headings: "",
      body: stripMarkdown(release.body),
    });
  }

  for (const slug of sitePageSlugs) {
    const page = await getSitePage(slug);
    if (!page) continue;
    documents.push({
      id: `page:${page.slug}`,
      href: `/${page.slug}`,
      title: page.title,
      description: page.description,
      group: "Pages",
      headings: extractHeadings(page.body),
      body: stripMarkdown(page.body),
    });
  }

  return documents;
}
