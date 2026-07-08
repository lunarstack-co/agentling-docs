import GithubSlugger from "github-slugger";

export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

/**
 * Extracts h2/h3 headings from markdown, generating the same ids as
 * rehype-slug so table-of-contents anchors always match the rendered HTML.
 */
export function extractToc(markdown: string): TocEntry[] {
  const slugger = new GithubSlugger();
  const entries: TocEntry[] = [];
  let inCodeFence = false;

  for (const line of markdown.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const match = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!match) continue;

    const text = match[2]
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[*_]/g, "");

    entries.push({
      id: slugger.slug(text),
      text,
      depth: match[1].length as 2 | 3,
    });
  }

  return entries;
}
