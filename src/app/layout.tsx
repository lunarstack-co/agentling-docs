import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import type { SearchItem } from "@/components/search";
import { getBlogPosts, getChangelog, getDocSections } from "@/lib/content";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

import "./globals.css";

export const revalidate = 300;

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} · The agent framework you can read in one sitting`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
    { media: "(prefers-color-scheme: light)", color: "#fbfbf9" },
  ],
};

async function buildSearchIndex(): Promise<SearchItem[]> {
  const [sections, posts, releases] = await Promise.all([
    getDocSections(),
    getBlogPosts(),
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
    ...posts.map((post) => ({
      title: post.title,
      description: post.excerpt,
      href: `/blog/${post.slug}`,
      group: "Blog",
    })),
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
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-accent-foreground"
          >
            Skip to content
          </a>
          <SiteHeader searchItems={searchItems} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
