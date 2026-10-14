"use client";

import { AlertCircle, FileText, GitPullRequest } from "lucide-react";
import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/toc";
import { GITHUB_DOCS_URL, GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

interface TocProps {
  items: TocEntry[];
  sectionSlug: string;
  slug: string;
}

export function Toc({ items, sectionSlug, slug }: TocProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0% 0% -65% 0%", threshold: 0.1 },
    );

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav
      aria-label="On this page"
      className="hidden xl:block w-[220px] shrink-0 text-xs"
    >
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pl-4 border-l border-border flex flex-col justify-between">
        <div>
          <p className="font-semibold text-foreground text-xs mb-3">
            On this page
          </p>

          {items.length > 0 && (
            <ul className="space-y-2">
              {items.map((item) => {
                const active = activeId === item.id;
                return (
                  <li
                    key={item.id}
                    style={{ paddingLeft: item.depth === 3 ? "0.75rem" : "0" }}
                  >
                    <a
                      href={`#${item.id}`}
                      className={cn(
                        "block transition-colors leading-snug",
                        active
                          ? "text-accent font-medium"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Quiet Trust Signals under the TOC outline */}
        <div className="mt-10 pt-6 border-t border-border space-y-2.5 text-[11px] text-muted-foreground">
          <p className="text-faint">Version: 0.1.0 (Latest)</p>

          <a
            href={`${GITHUB_DOCS_URL}/blob/main/content/docs/${sectionSlug}/${slug}.md`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <FileText className="size-3 text-faint" />
            <span>Edit this page</span>
          </a>

          <a
            href={`${GITHUB_URL}/issues/new`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <AlertCircle className="size-3 text-faint" />
            <span>Report an issue</span>
          </a>

          <a
            href={`${GITHUB_URL}/pulls`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <GitPullRequest className="size-3 text-faint" />
            <span>Open a PR</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
