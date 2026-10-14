"use client";

import { ChevronDown, FileText, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { DocSection } from "@/lib/content/types";
import { GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

// Diátaxis classification tags for section headers
const DIATAXIS_HINTS: Record<string, string> = {
  "getting-started": "Tutorials",
  "core-concepts": "Concepts",
  guides: "How-To",
  reference: "Reference",
};

function SectionNav({ sections, onNavigate }: { sections: DocSection[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="space-y-6 text-xs flex flex-col justify-between min-h-full">
      <div className="space-y-6">
        {sections.map((section) => {
          const modeHint = DIATAXIS_HINTS[section.slug];
          return (
            <div key={section.slug} className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <span>{section.title}</span>
                {modeHint && (
                  <span className="font-mono text-[9px] text-faint border border-border px-1 py-0.2 rounded font-normal">
                    {modeHint}
                  </span>
                )}
              </div>
              <ul className="space-y-0.5">
                {section.pages.map((page) => {
                  const href = `/docs/${section.slug}/${page.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={page.slug}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block px-2.5 py-1.5 rounded transition-colors text-xs leading-snug",
                          active
                            ? "bg-muted font-medium text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                        )}
                      >
                        {page.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Trust & Project Links */}
      <div className="border-t border-border pt-4 pb-2 space-y-1 font-mono text-[11px]">
        <div className="px-2 py-1 text-[10px] uppercase text-faint font-semibold">
          Legal & Project
        </div>
        <ul className="space-y-0.5">
          <li>
            <Link
              href="/privacy"
              onClick={onNavigate}
              className={cn(
                "block px-2 py-1 rounded transition-colors",
                pathname === "/privacy"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              Privacy policy
            </Link>
          </li>
          <li>
            <Link
              href="/terms"
              onClick={onNavigate}
              className={cn(
                "block px-2 py-1 rounded transition-colors",
                pathname === "/terms"
                  ? "bg-muted text-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              Terms of use
            </Link>
          </li>
          <li>
            <a
              href={`${GITHUB_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/40 flex items-center justify-between"
            >
              <span>MIT license</span>
              <span className="text-[10px] text-faint">↗</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export function DocsSidebar({ sections }: { sections: DocSection[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const current = sections
    .flatMap((section) =>
      section.pages.map((page) => ({
        title: page.title,
        href: `/docs/${section.slug}/${page.slug}`,
      })),
    )
    .find((page) => page.href === pathname);

  return (
    <>
      {/* Mobile: sticky page selector bar */}
      <div className="sticky top-14 z-30 flex w-full items-center justify-between border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <button
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          className="flex w-full cursor-pointer items-center justify-between text-xs font-medium"
        >
          <div className="flex items-center gap-2 truncate pr-2">
            <FileText className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-foreground truncate">
              {current?.title ?? "Documentation"}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200 shrink-0",
              mobileOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 top-14 z-50 flex flex-col bg-background/98 backdrop-blur-md">
            {/* Top close header bar */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-muted/40">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
                Documentation Index
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex size-7 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="size-4" />
              </button>
            </div>
            {/* Nav content */}
            <div className="flex-1 overflow-y-auto p-5">
              <SectionNav sections={sections} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop: 260px Left Map Rail */}
      <aside className="hidden lg:block w-[260px] shrink-0 border-r border-border">
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4 pr-3">
          <SectionNav sections={sections} />
        </div>
      </aside>
    </>
  );
}
