import { getBlogPost, getBlogPosts } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import { renderRss, RSS_HEADERS, type FeedItem } from "@/lib/rss";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export async function GET() {
  const metas = await getBlogPosts();
  const items: FeedItem[] = [];

  for (const meta of metas) {
    const post = await getBlogPost(meta.slug);
    if (!post) continue;
    const link = `${SITE_URL}/blog/${post.slug}`;
    items.push({
      title: post.title,
      link,
      guid: link,
      pubDate: new Date(post.publishDate).toUTCString(),
      description: post.excerpt,
      contentHtml: await renderMarkdown(post.body),
    });
  }

  return new Response(
    renderRss({
      title: "agentling blog",
      path: "/blog",
      description:
        "Release announcements and technical deep dives from the agentling project.",
      items,
    }),
    { headers: RSS_HEADERS },
  );
}
