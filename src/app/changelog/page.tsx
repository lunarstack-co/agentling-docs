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
    <div className="mx-auto w-full min-w-0 max-w-[760px] px-4 pb-20 pt-8 sm:px-6 lg:pt-10">
      <h1 className="text-balance text-h1 font-semibold tracking-[-0.02em] text-fg">
        Changelog
      </h1>
      <p className="mt-2.5 text-lede text-fg-secondary">
        What shipped, release by release. Releases are tagged on{" "}
        <a
          href={`${GITHUB_URL}/releases`}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors duration-150 hover:decoration-accent"
        >
          GitHub
        </a>
        .
      </p>

      <div className="mt-10">
        {entries.map((entry) => (
          <section
            key={entry.version}
            id={`v${entry.version}`}
            className="relative grid min-w-0 scroll-mt-24 gap-3 border-l border-border-subtle pb-10 pl-5 sm:grid-cols-[140px_minmax(0,1fr)] sm:gap-8 sm:pl-8"
          >
            <span
              aria-hidden
              className="absolute -left-1 top-1.5 size-[7px] rounded-full bg-accent"
            />
            <header className="min-w-0">
              <h2 className="font-mono text-[15px] font-medium leading-5 text-fg">
                v{entry.version}
              </h2>
              <time
                dateTime={entry.releaseDate}
                className="mt-1 block text-ui text-fg-secondary"
              >
                {formatDate(entry.releaseDate)}
              </time>
              {entry.tags.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="chip">
                      {tag}
                    </span>
                  ))}
                </p>
              )}
            </header>
            <div className="min-w-0">
              {entry.title && (
                <h3 className="text-h3 font-semibold text-fg">{entry.title}</h3>
              )}
              <div className="mt-2 min-w-0 break-words">
                <Markdown source={entry.body} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
