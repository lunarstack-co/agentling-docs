import type { Metadata } from "next";

import {
  AUTHOR_JSON_LD,
  GITHUB_URL,
  ORG,
  PYPI_URL,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  VERSION,
} from "./site";

export function absoluteUrl(path = "/"): string {
  return new URL(path, SITE_URL).toString();
}

/** Title used when a page sets none; also the site default. */
export const DEFAULT_TITLE =
  "Agentling, an async Python agent framework for tool use";

export type PageKind = "doc" | "changelog" | "page" | "notFound";

interface PageMetadataInput {
  kind: PageKind;
  /** Page part of the title; the layout template appends " | Agentling". */
  title: string;
  /** Use the title exactly as given, without the template. */
  absoluteTitle?: boolean;
  /** Search-result description. Falls back to the site tagline. */
  description?: string;
  /** Route path starting with "/". Required for every indexable kind. */
  path?: string;
  dates?: { published?: string; modified?: string };
}

/**
 * Feed autodiscovery links. Repeated on every page because Next.js
 * replaces (rather than deep-merges) the `alternates` object when a page
 * sets its canonical URL.
 */
const FEED_TYPES = {
  "application/rss+xml": [
    { url: "/changelog.xml", title: "agentling changelog" },
  ],
};

/**
 * The one place titles, descriptions, canonicals, Open Graph and Twitter
 * tags come from. `kind` decides the OG type, article dates, and whether
 * the page is indexable.
 */
export function pageMetadata({
  kind,
  title,
  absoluteTitle = false,
  description = SITE_TAGLINE,
  path,
  dates,
}: PageMetadataInput): Metadata {
  const titleField = absoluteTitle ? { absolute: title } : title;

  if (kind === "notFound") {
    return {
      title: titleField,
      description,
      robots: { index: false, follow: false },
    };
  }

  const isArticle = kind === "doc";
  return {
    title: titleField,
    description,
    alternates: { canonical: path, types: FEED_TYPES },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: isArticle ? "article" : "website",
      ...(isArticle
        ? {
            publishedTime: dates?.published,
            modifiedTime: dates?.modified,
            authors: [AUTHOR_JSON_LD.url],
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

/* ---------- JSON-LD ---------- */

const ORG_ID = `${SITE_URL}/#org`;
const SITE_ID = `${SITE_URL}/#site`;
const APP_ID = `${SITE_URL}/#app`;

/** Site-wide graph rendered once in the root layout. */
export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: ORG.name,
        url: SITE_URL,
        sameAs: [ORG.github],
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_TAGLINE,
        publisher: { "@id": ORG_ID },
      },
      AUTHOR_JSON_LD,
      {
        "@type": "SoftwareApplication",
        "@id": APP_ID,
        name: SITE_NAME,
        description: SITE_TAGLINE,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Python 3.11+",
        softwareVersion: VERSION,
        license: "https://opensource.org/license/mit",
        installUrl: PYPI_URL,
        url: SITE_URL,
        sameAs: [GITHUB_URL, PYPI_URL],
        author: { "@id": AUTHOR_JSON_LD["@id"] },
        creator: { "@id": AUTHOR_JSON_LD["@id"] },
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
    ],
  };
}

interface Crumb {
  name: string;
  path: string;
}

function breadcrumbList(crumbs: Crumb[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** Doc page: TechArticle plus a breadcrumb with an item at every position. */
export function docArticleGraph({
  title,
  description,
  path,
  published,
  modified,
  crumbs,
}: {
  title: string;
  description: string;
  path: string;
  published: string;
  modified: string;
  crumbs: Crumb[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: title,
        description,
        url: absoluteUrl(path),
        image: absoluteUrl(`${path}/opengraph-image`),
        datePublished: published,
        dateModified: modified,
        author: { "@id": AUTHOR_JSON_LD["@id"] },
        publisher: { "@id": ORG_ID },
        isPartOf: { "@id": SITE_ID },
        about: { "@id": APP_ID },
        inLanguage: "en",
      },
      breadcrumbList(crumbs),
    ],
  };
}

/** Changelog, contributing and legal pages. */
export function webPageGraph({
  title,
  description,
  path,
  modified,
  crumbs,
}: {
  title: string;
  description: string;
  path: string;
  modified?: string;
  crumbs: Crumb[];
}) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: title,
        description,
        url: absoluteUrl(path),
        ...(modified ? { dateModified: modified } : {}),
        isPartOf: { "@id": SITE_ID },
        inLanguage: "en",
      },
      breadcrumbList(crumbs),
    ],
  };
}
