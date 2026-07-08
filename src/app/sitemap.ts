import type { MetadataRoute } from "next";

import {
  getBlogPosts,
  getDocSections,
  getSitePageSlugs,
} from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sections, posts, sitePageSlugs] = await Promise.all([
    getDocSections(),
    getBlogPosts(),
    getSitePageSlugs(),
  ]);

  const staticRoutes = ["", "/docs", "/blog", "/changelog"].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
  }));

  return [
    ...staticRoutes,
    ...sections.flatMap((section) =>
      section.pages.map((page) => ({
        url: `${SITE_URL}/docs/${section.slug}/${page.slug}`,
        lastModified: new Date(),
      })),
    ),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishDate),
    })),
    ...sitePageSlugs.map((slug) => ({
      url: `${SITE_URL}/${slug}`,
      lastModified: new Date(),
    })),
  ];
}
