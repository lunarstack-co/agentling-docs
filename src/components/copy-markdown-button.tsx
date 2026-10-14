"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Copies the page's raw markdown, for pasting a doc page into an LLM. */
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
    <Button onClick={copy} aria-live="polite" className="-mr-2.5">
      {copied ? (
        <Check className="size-3.5 text-accent" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      {copied ? "Copied" : "Copy as Markdown"}
    </Button>
  );
}
