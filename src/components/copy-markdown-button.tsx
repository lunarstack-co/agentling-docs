"use client";

import { Check, FileCode } from "lucide-react";
import { useState } from "react";

/**
 * Copies the page's raw markdown source, handy for pasting a doc page
 * into an LLM conversation.
 */
export function CopyMarkdownButton({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable; nothing to recover.
    }
  }

  return (
    <button
      onClick={copy}
      aria-label={copied ? "Markdown copied" : "Copy page as Markdown"}
      className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
    >
      {copied ? (
        <Check className="size-3.5 text-accent" aria-hidden />
      ) : (
        <FileCode className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : "Copy as Markdown"}
    </button>
  );
}
