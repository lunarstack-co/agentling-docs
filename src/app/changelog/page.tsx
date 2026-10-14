import type { Metadata } from "next";

import { Markdown } from "@/components/markdown";
import { getChangelog } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { GITHUB_URL } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Changelog",
  description:
    "Every Agentling release, documented. Follows Keep a Changelog and semantic versioning.",
  path: "/changelog",
});

export default async function ChangelogPage() {
  const entries = await getChangelog();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Changelog
      </h1>
      <p className="mt-3 text-base text-muted-foreground leading-relaxed">
        What shipped, release by release. Releases are tagged on{" "}
        <a
          href={`${GITHUB_URL}/releases`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline underline-offset-2 hover:text-foreground"
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
            className="relative grid scroll-mt-24 gap-4 border-l border-border pb-12 pl-6 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:gap-8"
          >
            <span
              aria-hidden
              className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-foreground"
            />
            <header>
              <h2 className="font-mono text-base font-semibold text-foreground">
                v{entry.version}
              </h2>
              <time
                dateTime={entry.releaseDate}
                className="mt-1 block text-xs text-muted-foreground"
              >
                {formatDate(entry.releaseDate)}
              </time>
              <p className="mt-2.5 flex flex-wrap gap-1">
                {entry.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </p>
            </header>
            <div>
              {entry.title && (
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {entry.title}
                </h3>
              )}
              <div className="mt-2.5">
                <Markdown source={entry.body} className="prose-sm" />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
