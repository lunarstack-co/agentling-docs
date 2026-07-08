"use client";

import { useEffect, useState } from "react";

import type { TocEntry } from "@/lib/toc";
import { cn } from "@/lib/utils";

export function Toc({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (entries.length === 0) return;

    const headings = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => element !== null);

    const observer = new IntersectionObserver(
      (observed) => {
        const visible = observed.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-88px 0px -70% 0px" },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="On this page">
      <p className="font-mono text-xs font-semibold tracking-wider text-faint uppercase">
        On this page
      </p>
      <ul className="mt-3 space-y-0.5 text-sm">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className={cn(
                "block py-1 transition-colors duration-150",
                entry.depth === 3 && "pl-4",
                activeId === entry.id
                  ? "font-medium text-accent"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
