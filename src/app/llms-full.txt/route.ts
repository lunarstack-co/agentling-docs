import {
  getChangelog,
  getDocPage,
  getDocSections,
} from "@/lib/content";
import { GITHUB_URL, SITE_TAGLINE, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

/** The entire documentation corpus as one markdown document for LLMs. */
export async function GET() {
  const [sections, releases] = await Promise.all([
    getDocSections(),
    getChangelog(),
  ]);

  const parts: string[] = [
    "# agentling documentation",
    "",
    `> ${SITE_TAGLINE}`,
    "",
    `Source: ${SITE_URL} · Repository: ${GITHUB_URL} · License: MIT`,
    "",
  ];

  for (const section of sections) {
    for (const meta of section.pages) {
      const page = await getDocPage(meta.slug);
      if (!page) continue;
      parts.push(
        "---",
        "",
        `# ${section.title}: ${page.title}`,
        "",
        `> ${page.description}`,
        "",
        page.body,
        "",
      );
    }
  }

  parts.push("---", "", "# Changelog", "");
  for (const release of releases) {
    parts.push(
      `## v${release.version} (${release.releaseDate})${release.title ? `: ${release.title}` : ""}`,
      "",
      release.body,
      "",
    );
  }

  return new Response(parts.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
