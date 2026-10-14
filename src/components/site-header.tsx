"use client";

import { ChevronDown, ExternalLink, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { GithubIcon } from "@/components/icons/github";
import { Logo } from "@/components/logo";
import { SearchDialog, type SearchItem } from "@/components/search";
import { ThemeToggle } from "@/components/theme-toggle";
import { GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/docs", label: "Documentation" },
  { href: "/changelog", label: "Changelog" },
  { href: "/contributing", label: "Contributing" },
];

export function SiteHeader({ searchItems }: { searchItems: SearchItem[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
    setVersionOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-border bg-background/90 backdrop-blur-md transition-colors w-full overflow-hidden">
      <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-1 sm:gap-3 px-3 sm:px-6">
        {/* Left: Logo + Version Dropdown Pill */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink min-w-0">
          <Logo />

          <div className="relative shrink-0 hidden sm:block">
            <button
              onClick={() => setVersionOpen((o) => !o)}
              aria-label="Version selector"
              aria-expanded={versionOpen}
              className="flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors cursor-pointer"
            >
              <span>v0.1.0</span>
              <ChevronDown className="size-3 opacity-60" />
            </button>

            {versionOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-32 border border-border bg-card p-1 text-xs shadow-md z-50 rounded"
                onClick={() => setVersionOpen(false)}
              >
                <div className="px-2 py-1 font-mono text-[10px] text-faint uppercase">
                  Releases
                </div>
                <Link
                  href="/changelog"
                  className="flex items-center justify-between px-2 py-1 text-foreground font-medium rounded hover:bg-muted"
                >
                  <span>v0.1.0</span>
                  <span className="text-[10px] text-accent">Latest</span>
                </Link>
                <a
                  href={`${GITHUB_URL}/releases`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-2 py-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted"
                >
                  <span>All versions</span>
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
            )}
          </div>

          <nav aria-label="Main" className="hidden lg:flex items-center gap-1 ml-2">
            {NAV.map((item) => {
              const active =
                item.href === "/docs"
                  ? pathname.startsWith("/docs")
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "px-2.5 py-1 text-xs transition-colors rounded",
                    active
                      ? "text-foreground font-semibold bg-muted"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Field */}
        <div className="flex-1 min-w-0 max-w-[120px] xs:max-w-[180px] sm:max-w-xs md:max-w-md mx-1 sm:mx-2">
          <SearchDialog items={searchItems} />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden xl:flex items-center rounded border border-border bg-card px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">Python</span>
            <span className="text-faint ml-1">3.11+</span>
          </div>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Agentling on GitHub"
            className="hidden sm:flex size-8 items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors"
          >
            <GithubIcon className="size-3.5" aria-hidden />
          </a>

          <ThemeToggle />

          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex size-8 cursor-pointer items-center justify-center rounded border border-border text-muted-foreground lg:hidden shrink-0"
          >
            {menuOpen ? <X className="size-3.5" aria-hidden /> : <Menu className="size-3.5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="border-t border-border bg-background px-4 py-3 lg:hidden shadow-lg"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block px-3 py-1.5 text-xs rounded",
                    pathname.startsWith(item.href)
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
