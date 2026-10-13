import { getBlogPosts, getChangelog, getDocSections } from "@/lib/content";
import { GITHUB_URL, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/**
 * llms.txt index per https://llmstxt.org: a compact, LLM-friendly map of
 * the site. The full corpus lives at /llms-full.txt.
 */
export async function GET() {
  const [sections, posts, releases] = await Promise.all([
    getDocSections(),
    getBlogPosts(),
    getChangelog(),
  ]);

  const lines: string[] = [
    "# agentling",
    "",
    `> ${SITE_TAGLINE} A clean ReAct loop, typed memory, streaming events, recoverable failures, and progressive-disclosure skills, in a Python codebase small enough to read in one sitting.`,
    "",
    "agentling is an open source (MIT) Python framework. This site hosts its documentation, blog, and changelog. The complete documentation text is available at " +
      `${SITE_URL}/llms-full.txt.`,
    "",
  ];

  for (const section of sections) {
    lines.push(`## ${section.title}`, "");
    for (const page of section.pages) {
      lines.push(
        `- [${page.title}](${SITE_URL}/docs/${section.slug}/${page.slug}): ${page.description}`,
      );
    }
    lines.push("");
  }

  lines.push("## Blog", "");
  for (const post of posts) {
    lines.push(`- [${post.title}](${SITE_URL}/blog/${post.slug}): ${post.excerpt}`);
  }
  lines.push("");

  lines.push("## Optional", "");
  lines.push(`- [Changelog](${SITE_URL}/changelog): all releases, latest v${releases[0]?.version ?? ""}`);
  lines.push(`- [Roadmap](${SITE_URL}/roadmap): where the framework is heading, milestone by milestone`);
  lines.push(`- [Contributing](${SITE_URL}/contributing): development setup and guidelines`);
  lines.push(`- [GitHub repository](${GITHUB_URL}): source code`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
