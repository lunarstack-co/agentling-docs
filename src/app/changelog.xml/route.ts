import { getChangelog } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { renderRss, RSS_HEADERS, type FeedItem } from "@/lib/rss";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const releases = await getChangelog();
  const items: FeedItem[] = [];

  for (const release of releases) {
    const link = `${SITE_URL}/changelog#v${release.version}`;
    items.push({
      title: `agentling v${release.version}${release.title ? `: ${release.title}` : ""}`,
      link,
      guid: link,
      pubDate: new Date(release.releaseDate).toUTCString(),
      description: `agentling ${release.version}, released ${release.releaseDate}.`,
      contentHtml: await renderMarkdown(release.body),
    });
  }

  return new Response(
    renderRss({
      title: "agentling changelog",
      path: "/changelog",
      description: "Every agentling release, documented.",
      items,
    }),
    { headers: RSS_HEADERS },
  );
}
