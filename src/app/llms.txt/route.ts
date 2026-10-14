import { getDocSections } from "@/lib/content";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export async function GET(): Promise<Response> {
  const sections = await getDocSections();

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_TAGLINE}`,
    "",
    "Agentling is an open source (MIT) Python framework. This site hosts its documentation and changelog. The complete documentation text is available at " +
      `${SITE_URL}/llms-full.txt for LLM digestion.`,
    "",
    "## Documentation",
    "",
  ];

  for (const section of sections) {
    lines.push(`### ${section.title}`);
    lines.push("");
    for (const page of section.pages) {
      lines.push(
        `- [${page.title}](${SITE_URL}/docs/${section.slug}/${page.slug}): ${page.description}`,
      );
    }
    lines.push("");
  }

  lines.push("## Project");
  lines.push("");
  lines.push(`- [Changelog](${SITE_URL}/changelog): every release documented`);
  lines.push(`- [Contributing](${SITE_URL}/contributing): how to set up the dev environment and run checks`);
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
