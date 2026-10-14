import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import type { SearchItem } from "@/components/search";
import { getChangelog, getDocSections } from "@/lib/content";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
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
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
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
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans bg-background text-foreground">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[4px] focus:bg-foreground focus:px-3 focus:py-1.5 focus:text-xs focus:font-medium focus:text-background"
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
