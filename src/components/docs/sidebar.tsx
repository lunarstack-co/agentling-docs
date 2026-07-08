"use client";

import {
  BookOpen,
  ChevronDown,
  Code,
  Compass,
  Layers,
  Rocket,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import type { DocSection } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  layers: Layers,
  compass: Compass,
  code: Code,
  "book-open": BookOpen,
};

function SectionNav({ sections }: { sections: DocSection[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="space-y-7">
      {sections.map((section) => {
        const Icon = ICONS[section.icon] ?? BookOpen;
        return (
          <div key={section.slug}>
            <p className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-foreground uppercase">
              <Icon className="size-3.5 text-accent" aria-hidden />
              {section.title}
            </p>
            <ul className="mt-3 space-y-0.5 border-l border-border">
              {section.pages.map((page) => {
                const href = `/docs/${section.slug}/${page.slug}`;
                const active = pathname === href;
                return (
                  <li key={page.slug}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "-ml-px block border-l py-1.5 pl-4 text-sm transition-colors duration-150",
                        active
                          ? "border-accent font-medium text-accent"
                          : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground",
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
      {/* Mobile: collapsible page picker */}
      <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <button
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          className="flex w-full cursor-pointer items-center justify-between text-sm"
        >
          <span className="font-medium text-foreground">
            {current?.title ?? "Browse docs"}
          </span>
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-200",
              mobileOpen && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {mobileOpen && (
          <div className="max-h-[60vh] overflow-y-auto py-4" onClick={() => setMobileOpen(false)}>
            <SectionNav sections={sections} />
          </div>
        )}
      </div>

      {/* Desktop: sticky rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-10 pr-6">
          <SectionNav sections={sections} />
        </div>
      </aside>
    </>
  );
}
