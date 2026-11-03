import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import { rehypeCallouts } from "./rehype-callouts";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // Content is written in this repository, so raw HTML (the inline SVG
  // diagrams) is trusted and passed through.
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeCallouts)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, {
    behavior: "append",
    properties: {
      className: ["heading-anchor"],
      ariaLabel: "Link to this section",
    },
    content: { type: "text", value: "#" },
  })
  .use(rehypePrettyCode, {
    // GitHub's own syntax themes; globals.css picks one per site theme.
    theme: { light: "github-light", dark: "github-dark" },
    keepBackground: false,
    // Block scope only: a bare string would also run every inline code
    // span through shiki, breaking the prose inline-code styling.
    defaultLang: { block: "text" },
  })
  .use(rehypeStringify);

export async function renderMarkdown(source: string): Promise<string> {
  const file = await processor.process(source);
  return String(file);
}
