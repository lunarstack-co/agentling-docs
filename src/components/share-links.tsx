"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

import {
  HackerNewsIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/icons/brands";
import { cn } from "@/lib/utils";

const BUTTON_CLASS =
  "flex size-8 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground";

/**
 * Share row for articles and doc pages: copy link, X, LinkedIn, and
 * Hacker News. `url` must be absolute since it is handed to the networks.
 */
export function ShareLinks({
  url,
  title,
  label = "Share",
  className,
}: {
  url: string;
  title: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable; the share links still work.
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const networks = [
    {
      name: "Share on X",
      href: `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`,
      icon: XIcon,
    },
    {
      name: "Share on LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: LinkedInIcon,
    },
    {
      name: "Submit to Hacker News",
      href: `https://news.ycombinator.com/submitlink?u=${encodedUrl}&t=${encodedTitle}`,
      icon: HackerNewsIcon,
    },
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="mr-1 font-mono text-xs font-semibold tracking-wider text-faint uppercase">
        {label}
      </span>
      <button
        onClick={copy}
        aria-label={copied ? "Link copied" : "Copy link"}
        title="Copy link"
        className={BUTTON_CLASS}
      >
        {copied ? (
          <Check className="size-4 text-accent" aria-hidden />
        ) : (
          <Link2 className="size-4" aria-hidden />
        )}
      </button>
      {networks.map((network) => (
        <a
          key={network.name}
          href={network.href}
          target="_blank"
          rel="noreferrer"
          aria-label={network.name}
          title={network.name}
          className={BUTTON_CLASS}
        >
          <network.icon className="size-4" aria-hidden />
        </a>
      ))}
    </div>
  );
}
