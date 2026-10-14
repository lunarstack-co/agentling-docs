import { SITE_NAME, SITE_URL } from "./site";

export interface FeedItem {
  title: string;
  link: string;
  guid: string;
  pubDate: string;
  description: string;
  contentHtml: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Renders an RSS 2.0 document with full HTML content per item. */
export function renderRss({
  title,
  path,
  feedPath,
  description,
  items,
}: {
  title: string;
  /** The HTML page the feed describes. */
  path: string;
  /** The feed's own route, used for the atom:link rel="self". */
  feedPath: string;
  description: string;
  items: FeedItem[];
}): string {
  const channelUrl = `${SITE_URL}${path}`;
  const selfUrl = `${SITE_URL}${feedPath}`;
  const lastBuildDate = items[0]?.pubDate ?? new Date().toUTCString();

  const itemsXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
      <content:encoded><![CDATA[${item.contentHtml.replace(/\]\]>/g, "]]]]><![CDATA[>")}]]></content:encoded>
    </item>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(channelUrl)}</link>
    <atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml"/>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <generator>${escapeXml(SITE_NAME)}</generator>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${itemsXml}
  </channel>
</rss>
`;
}

export const RSS_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
};
