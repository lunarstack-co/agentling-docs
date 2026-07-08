import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypePrettyCode, {
    themes: { light: "github-light", dark: "github-dark-dimmed" },
    keepBackground: false,
    defaultLang: "text",
  })
  .use(rehypeStringify);

export async function renderMarkdown(source: string): Promise<string> {
  const file = await processor.process(source);
  return String(file);
}
