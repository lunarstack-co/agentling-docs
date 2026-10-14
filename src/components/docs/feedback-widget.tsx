"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { GITHUB_DOCS_URL } from "@/lib/site";

/**
 * "Was this page helpful?" There is no feedback backend, so a "no" hands
 * the reader a pre-filled GitHub issue instead of pretending to collect a
 * comment.
 */
export function FeedbackWidget({
  pageTitle,
  pagePath,
}: {
  pageTitle: string;
  pagePath: string;
}) {
  const [voted, setVoted] = useState<"yes" | "no" | null>(null);

  const issueUrl = `${GITHUB_DOCS_URL}/issues/new?${new URLSearchParams({
    title: `Docs feedback: ${pageTitle}`,
    body: `Page: ${pagePath}\n\nWhat was missing or unclear?\n\n`,
  }).toString()}`;

  return (
    <div className="border-t border-border-subtle pt-5 text-ui">
      <div className="flex flex-wrap items-center gap-3">
        <span className="mr-auto font-medium text-fg">
          {voted === "yes" ? "Glad it helped." : "Was this page helpful?"}
        </span>
        {voted !== "yes" && (
          <>
            <Button variant="outline" onClick={() => setVoted("yes")}>
              Yes
            </Button>
            <Button
              variant="outline"
              aria-pressed={voted === "no"}
              onClick={() => setVoted("no")}
              className={voted === "no" ? "border-accent text-accent" : undefined}
            >
              No
            </Button>
          </>
        )}
      </div>

      {voted === "no" && (
        <p className="mt-3 text-fg-secondary">
          Tell us what was missing in a{" "}
          <a
            href={issueUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent underline underline-offset-[3px]"
          >
            GitHub issue
          </a>
          , pre-filled with this page.
        </p>
      )}
    </div>
  );
}
