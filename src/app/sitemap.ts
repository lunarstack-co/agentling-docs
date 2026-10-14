import type { MetadataRoute } from "next";

import { getDocSections, getSitePageSlugs } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sections, sitePageSlugs] = await Promise.all([
    getDocSections(),
    getSitePageSlugs(),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const docRoutes: MetadataRoute.Sitemap = sections.flatMap((section) =>
    section.pages.map((page) => ({
      url: `${SITE_URL}/docs/${section.slug}/${page.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  );

  const standaloneRoutes: MetadataRoute.Sitemap = sitePageSlugs.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: slug === "contributing" ? 0.6 : 0.3,
  }));

  return [...staticRoutes, ...docRoutes, ...standaloneRoutes];
}
