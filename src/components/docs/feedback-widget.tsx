"use client";

import { Check, ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

import { GITHUB_DOCS_URL } from "@/lib/site";

/**
 * Lightweight "was this helpful?" prompt. There is no feedback backend, so
 * a "no" hands the reader straight to a pre-filled GitHub issue instead of
 * pretending to collect a comment.
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

  if (voted === "yes") {
    return (
      <div className="flex items-center gap-2 rounded border border-border bg-card p-3 font-sans text-xs text-muted-foreground">
        <Check className="size-3.5 text-accent" aria-hidden />
        <span>Glad it helped.</span>
      </div>
    );
  }

  return (
    <div className="rounded border border-border bg-card p-4 text-xs font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium text-foreground">
          Was this page helpful?
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoted("yes")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <ThumbsUp className="size-3" aria-hidden />
            <span>Yes</span>
          </button>
          <button
            onClick={() => setVoted("no")}
            aria-pressed={voted === "no"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border transition-colors cursor-pointer ${
              voted === "no"
                ? "border-accent bg-accent-soft text-accent font-medium"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <ThumbsDown className="size-3" aria-hidden />
            <span>No</span>
          </button>
        </div>
      </div>

      {voted === "no" && (
        <p className="mt-3 pt-3 border-t border-border text-muted-foreground leading-relaxed">
          Sorry about that. Tell us what was missing in a{" "}
          <a
            href={issueUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-accent underline underline-offset-2"
          >
            GitHub issue
          </a>
          , pre-filled with this page.
        </p>
      )}
    </div>
  );
}
