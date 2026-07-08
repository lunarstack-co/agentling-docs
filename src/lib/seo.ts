import type { Metadata } from "next";

import { SITE_NAME, SITE_URL } from "./site";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

interface PageMetadataInput {
  title: string;
  description: string;
  /** Route path starting with "/", used for the canonical and og:url. */
  path: string;
  ogType?: "website" | "article";
  /** Extra Open Graph article fields (publish date, authors, tags). */
  article?: {
    publishedTime?: string;
    authors?: string[];
    tags?: string[];
  };
}

/**
 * Builds the full per-page metadata: canonical URL, Open Graph, and Twitter
 * card, all derived from one title/description/path triple so they can
 * never drift apart. Relative URLs resolve against metadataBase.
 */
export function pageMetadata({
  title,
  description,
  path,
  ogType = "website",
  article,
}: PageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: ogType,
      ...(ogType === "article" && article
        ? {
            publishedTime: article.publishedTime,
            authors: article.authors,
            tags: article.tags,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
