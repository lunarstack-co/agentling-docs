import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import type { SearchItem } from "@/components/search";
import { getChangelog, getDocSections } from "@/lib/content";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { THEME_COLORS } from "@/lib/theme";

import "./globals.css";

// Both faces are SIL Open Font License 1.1. next/font downloads them at
// build time, subsets to Latin, self-hosts the files, and sets
// font-display: swap.
const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} Documentation`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  authors: [{ name: "Folarin Akinloye", url: "https://folarin.dev" }],
  creator: "Folarin Akinloye",
  publisher: SITE_NAME,
  category: "technology",
  keywords: [
    "Agentling",
    "AI agents",
    "agent framework",
    "Python",
    "async",
    "ReAct loop",
    "tool calling",
    "LLM",
    "open source",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    types: {
      "application/rss+xml": [
        { url: "/changelog.xml", title: "Agentling changelog" },
      ],
    },
  },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: THEME_COLORS.dark },
    { media: "(prefers-color-scheme: light)", color: THEME_COLORS.light },
  ],
};

async function buildSearchIndex(): Promise<SearchItem[]> {
  const [sections, releases] = await Promise.all([
    getDocSections(),
    getChangelog(),
  ]);

  return [
    ...sections.flatMap((section) =>
      section.pages.map((page) => ({
        title: page.title,
        description: page.description,
        href: `/docs/${section.slug}/${page.slug}`,
        group: section.title,
      })),
    ),
    ...releases.map((release) => ({
      title: `v${release.version} ${release.title}`.trim(),
      description: `Released ${release.releaseDate}`,
      href: "/changelog",
      group: "Changelog",
    })),
  ];
}

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const searchItems = await buildSearchIndex();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${plexSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-base font-sans text-fg">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-control focus:bg-fg focus:px-3 focus:py-1.5 focus:text-ui focus:font-medium focus:text-fg-inverse"
          >
            Skip to content
          </a>
          <SiteHeader searchItems={searchItems} />
          <div id="main" className="flex-1 flex flex-col">
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
