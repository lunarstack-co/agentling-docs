import type { Metadata } from "next";

import { Markdown } from "@/components/markdown";
import { getChangelog } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { GITHUB_URL } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Changelog",
  description:
    "Every agentling release, documented. The format follows Keep a Changelog and the project aims to follow semantic versioning.",
  path: "/changelog",
});

export default async function ChangelogPage() {
  const entries = await getChangelog();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="font-mono text-xs font-semibold tracking-wider text-accent uppercase">
        Changelog
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        What shipped, release by release
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">
        The format follows Keep a Changelog, and the project aims to follow
        semantic versioning. Releases are tagged on{" "}
        <a
          href={`${GITHUB_URL}/releases`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
        >
          GitHub
        </a>
        .
      </p>

      <div className="mt-12 space-y-0">
        {entries.map((entry) => (
          <section
            key={entry.version}
            id={`v${entry.version}`}
            className="relative grid scroll-mt-24 gap-4 border-l border-border pb-14 pl-8 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-8"
          >
            <span
              aria-hidden
              className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-accent ring-4 ring-background"
            />
            <header>
              <h2 className="font-mono text-lg font-semibold text-foreground">
                v{entry.version}
              </h2>
              <time
                dateTime={entry.releaseDate}
                className="mt-1 block text-xs text-muted-foreground"
              >
                {formatDate(entry.releaseDate)}
              </time>
              <p className="mt-3 flex flex-wrap gap-1.5">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent-soft px-2.5 py-0.5 font-mono text-[11px] font-medium text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </p>
            </header>
            <div>
              {entry.title && (
                <h3 className="text-xl font-semibold tracking-tight text-foreground">
                  {entry.title}
                </h3>
              )}
              <div className="mt-3">
                <Markdown source={entry.body} className="prose-sm" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
