"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { GithubIcon } from "@/components/icons/github";
import { Logo } from "@/components/logo";
import { SearchDialog, type SearchItem } from "@/components/search";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonClass } from "@/components/ui/button";
import { GITHUB_URL, VERSION } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/docs", label: "Documentation" },
  { href: "/changelog", label: "Changelog" },
  { href: "/contributing", label: "Contributing" },
];

export function SiteHeader({ searchItems }: { searchItems: SearchItem[] }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 h-14 w-full border-b border-border-subtle bg-base/92 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <div className="flex shrink-0 items-center gap-2.5">
          <Logo />
          <Link
            href={`/changelog#v${VERSION}`}
            className="chip hidden transition-colors duration-150 hover:text-fg sm:inline-flex"
            aria-label={`Version ${VERSION}, view changelog`}
          >
            v{VERSION}
          </Link>
        </div>

        <nav aria-label="Main" className="ml-2 hidden items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 items-center whitespace-nowrap rounded-control px-2.5 text-ui transition-[background-color,color] duration-150",
                  active
                    ? "bg-sunken font-medium text-fg"
                    : "text-fg-secondary hover:bg-sunken hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Below lg the search sits with the right-hand controls; from lg it
            takes the centre column. */}
        <div className="ml-auto shrink-0 sm:w-full sm:max-w-xs lg:mx-auto lg:ml-0 lg:max-w-md lg:flex-1">
          <SearchDialog items={searchItems} />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Agentling on GitHub"
            className={buttonClass({ variant: "outline", icon: true, className: "hidden sm:inline-flex" })}
          >
            <GithubIcon className="size-3.5" aria-hidden />
          </a>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="site-mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className={buttonClass({ variant: "outline", icon: true, className: "lg:hidden" })}
          >
            {menuOpen ? <X className="size-3.5" aria-hidden /> : <Menu className="size-3.5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="site-mobile-nav"
          aria-label="Mobile"
          className="absolute inset-x-0 top-full border-b border-border-subtle bg-base px-4 py-2 shadow-popover lg:hidden"
        >
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 items-center rounded-control px-3 text-sm",
                    isActive(item.href)
                      ? "bg-sunken font-medium text-fg"
                      : "text-fg-secondary hover:text-fg",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-border-subtle pt-1 sm:hidden">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 items-center gap-2 rounded-control px-3 text-sm text-fg-secondary hover:text-fg"
              >
                <GithubIcon className="size-3.5" aria-hidden />
                GitHub
                <span className="chip ml-auto">v{VERSION}</span>
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
