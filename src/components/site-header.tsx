"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";

import { GithubIcon } from "@/components/icons/github";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/logo";
import { SearchDialog, type SearchItem } from "@/components/search";
import { ThemeToggle } from "@/components/theme-toggle";
import { GITHUB_URL } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/docs", label: "Docs" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/contributing", label: "Contributing" },
];

export function SiteHeader({ searchItems }: { searchItems: SearchItem[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on navigation, adjusting state during render
  // instead of in an effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          <SearchDialog items={searchItems} />
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="agentling on GitHub"
            className="hidden size-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground sm:flex"
          >
            <GithubIcon className="size-4" aria-hidden />
          </a>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-border text-muted-foreground md:hidden"
          >
            {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          aria-label="Mobile"
          className="border-t border-border bg-background px-4 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-sm",
                    pathname.startsWith(item.href)
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <GithubIcon className="size-4" aria-hidden />
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </nav>
      )}
    </header>
  );
}
