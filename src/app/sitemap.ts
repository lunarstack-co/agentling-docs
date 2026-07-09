import type { MetadataRoute } from "next";

import {
  getBlogPosts,
  getDocSections,
  getSitePageSlugs,
} from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sections, posts, sitePageSlugs] = await Promise.all([
    getDocSections(),
    getBlogPosts(),
    getSitePageSlugs(),
  ]);

  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...sections.flatMap((section) =>
      section.pages.map((page) => ({
        url: `${SITE_URL}/docs/${section.slug}/${page.slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
    ),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishDate),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...sitePageSlugs.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: ["contributing", "roadmap"].includes(slug) ? 0.6 : 0.3,
    })),
  ];
}
