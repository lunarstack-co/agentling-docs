"use client";

import { AlertCircle, ChevronDown, Pencil } from "lucide-react";
import { useEffect, useState } from "react";

import type { TocEntry } from "@/lib/toc";
import { GITHUB_DOCS_URL, GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

interface TocProps {
  items: TocEntry[];
  sectionSlug: string;
  slug: string;
}

function useActiveHeading(items: TocEntry[]): string {
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

  return activeId;
}

/** Right rail from xl up. */
export function Toc({ items, sectionSlug, slug }: TocProps) {
  const activeId = useActiveHeading(items);

  return (
    <nav aria-label="On this page" className="hidden w-[220px] shrink-0 text-ui xl:block">
      <div className="sticky top-24 grid max-h-[calc(100vh-7rem)] gap-6 overflow-y-auto border-l border-border-subtle pl-4">
        {items.length > 0 && (
          <div>
            <p className="mb-2 font-semibold text-fg">On this page</p>
            <ul className="grid gap-0.5">
              {items.map((item) => {
                const active = activeId === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "-ml-[17px] flex min-h-6 items-center border-l-2 pl-4 leading-snug transition-colors duration-150",
                        item.depth === 3 && "pl-7",
                        active
                          ? "border-accent text-accent"
                          : "border-transparent text-fg-secondary hover:text-fg",
                      )}
                    >
                      {item.text}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className={cn("grid gap-1.5 text-fg-tertiary", items.length > 0 && "border-t border-border-subtle pt-4")}>
          <a
            href={`${GITHUB_DOCS_URL}/blob/main/content/docs/${sectionSlug}/${slug}.md`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition-colors duration-150 hover:text-fg"
          >
            <Pencil className="size-3" aria-hidden />
            Edit this page
          </a>
          <a
            href={`${GITHUB_URL}/issues/new`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 transition-colors duration-150 hover:text-fg"
          >
            <AlertCircle className="size-3" aria-hidden />
            Report an issue
          </a>
        </div>
      </div>
    </nav>
  );
}

/** Collapsible "On this page" shown under the lede below xl. */
export function TocInline({ items }: { items: TocEntry[] }) {
  if (items.length === 0) return null;
  return (
    <details className="group mt-4 rounded-panel border border-border-subtle bg-raised text-ui xl:hidden">
      <summary className="flex h-9 cursor-pointer list-none items-center justify-between px-3 font-medium text-fg [&::-webkit-details-marker]:hidden">
        On this page
        <ChevronDown className="size-3.5 text-fg-tertiary transition-transform duration-150 group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="grid gap-0.5 px-3 pb-2 pt-0.5">
        {items.map((item) => (
          <li key={item.id} className={cn(item.depth === 3 && "pl-3")}>
            <a href={`#${item.id}`} className="flex min-h-6 items-center text-fg-secondary hover:text-fg">
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
