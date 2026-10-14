import type { MetadataRoute } from "next";

import path from "node:path";

import {
  getContentModified,
  getDocSections,
  getSitePage,
  getSitePageSlugs,
} from "@/lib/content";
import { getFileDates } from "@/lib/content/dates";
import { SITE_URL } from "@/lib/site";

/**
 * Lists only indexable, canonical, 200-status URLs. The root and /docs are
 * redirects and are left out. lastModified comes from git per file.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sections, sitePageSlugs, changelogModified] = await Promise.all([
    getDocSections(),
    getSitePageSlugs(),
    getContentModified("changelog"),
  ]);

  const docRoutes: MetadataRoute.Sitemap = sections.flatMap((section) =>
    section.pages.map((page) => ({
      url: `${SITE_URL}/docs/${section.slug}/${page.slug}`,
      lastModified: page.modified,
      priority: 0.9,
    })),
  );

  const sitePages = await Promise.all(sitePageSlugs.map((slug) => getSitePage(slug)));
  const standaloneRoutes: MetadataRoute.Sitemap = sitePages
    .filter((page): page is NonNullable<typeof page> => page !== null)
    .map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: page.modified,
      priority: page.slug === "contributing" ? 0.6 : 0.3,
    }));

  // /creator is indexable but intentionally unlinked from navigation; the
  // sitemap is how crawlers find it. See src/app/creator/page.tsx.
  const creatorModified = getFileDates(
    path.join(process.cwd(), "src/app/creator/page.tsx"),
  ).modified;

  return [
    ...docRoutes,
    { url: `${SITE_URL}/changelog`, lastModified: changelogModified, priority: 0.7 },
    ...standaloneRoutes,
    { url: `${SITE_URL}/creator`, lastModified: creatorModified, priority: 0.5 },
  ];
}
