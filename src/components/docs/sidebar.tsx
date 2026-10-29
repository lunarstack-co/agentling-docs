"use client";

import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { buttonClass } from "@/components/ui/button";
import type { DocSection } from "@/lib/content/types";
import { GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

const ROW =
  "flex h-8 items-center rounded-control px-2 text-ui transition-[background-color,color] duration-150";
const ROW_IDLE = "text-fg-secondary hover:bg-sunken hover:text-fg";
const ROW_ACTIVE = "bg-sunken font-medium text-fg shadow-[inset_2px_0_0_var(--accent)]";

function SectionNav({
  sections,
  onNavigate,
}: {
  sections: DocSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="flex min-h-full flex-col gap-6">
      {sections.map((section) => (
        <div key={section.slug} className="grid gap-0.5">
          <div className="eyebrow px-2 pb-1.5">{section.title}</div>
          {section.pages.map((page) => {
            const href = `/docs/${section.slug}/${page.slug}`;
            const active = pathname === href;
            return (
              <Link
                key={page.slug}
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(ROW, active ? ROW_ACTIVE : ROW_IDLE)}
              >
                {page.title}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="mt-auto grid gap-0.5 border-t border-border-subtle pt-4">
        {[
          { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(ROW, "h-7", pathname === item.href ? ROW_ACTIVE : ROW_IDLE)}
          >
            {item.label}
          </Link>
        ))}
        <a
          href={`${GITHUB_URL}/blob/main/LICENSE`}
          target="_blank"
          rel="noreferrer"
          className={cn(ROW, "h-7", ROW_IDLE)}
        >
          MIT license
        </a>
      </div>
    </nav>
  );
}

export function DocsSidebar({ sections }: { sections: DocSection[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
  }

  // While the sheet is open: lock page scroll, move focus in, trap Tab,
  // close on Escape, and return focus to the trigger afterwards.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const sheet = closeRef.current?.closest<HTMLElement>("[role=dialog]");
      const focusable = sheet?.querySelectorAll<HTMLElement>("a[href], button");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [mobileOpen]);

  const current = sections
    .flatMap((section) =>
      section.pages.map((page) => ({
        title: page.title,
        href: `/docs/${section.slug}/${page.slug}`,
      })),
    )
    .find((page) => page.href === pathname);

  // Portaled so the sticky bar's backdrop-filter cannot become this fixed
  // sheet's containing block.
  const sheet = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Documentation index"
      className="fixed inset-x-0 bottom-0 top-14 z-50 flex flex-col bg-base lg:hidden"
    >
      <div className="flex h-11 items-center justify-between border-b border-border-subtle bg-sunken px-4">
        <span className="text-ui font-medium text-fg">Documentation</span>
        <button
          ref={closeRef}
          type="button"
          onClick={() => setMobileOpen(false)}
          className={buttonClass({ variant: "outline", icon: true })}
          aria-label="Close menu"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain p-4">
        <SectionNav sections={sections} onNavigate={() => setMobileOpen(false)} />
      </div>
    </div>
  );

  return (
    <>
      {/* Below lg: sticky page selector. */}
      <div className="sticky top-14 z-30 w-full border-b border-border-subtle bg-base/95 px-4 backdrop-blur-md lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-haspopup="dialog"
          className="flex h-10 w-full cursor-pointer items-center justify-between gap-2 text-ui font-medium text-fg"
        >
          <span className="truncate">{current?.title ?? "Documentation"}</span>
          <ChevronDown className="size-3.5 shrink-0 text-fg-tertiary" aria-hidden />
        </button>
      </div>

      {mobileOpen && mounted && createPortal(sheet, document.body)}

      {/* From lg: 240px rail. */}
      <aside className="hidden w-60 shrink-0 border-r border-border-subtle lg:block">
        <div className="sticky top-14 max-h-[calc(100vh-3.5rem)] overflow-y-auto py-5 pl-4 pr-3">
          <SectionNav sections={sections} />
        </div>
      </aside>
    </>
  );
}
