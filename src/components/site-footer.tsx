import Link from "next/link";

import { GITHUB_URL, ORG } from "@/lib/site";

const LINKS = [
  { label: "Changelog", href: "/changelog" },
  { label: "Contributing", href: "/contributing" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

/** One line: who publishes the site, the licence, and the pages the
 *  header does not link. Present on every route so legal pages are
 *  reachable outside the docs sidebar. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border-subtle">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-5 text-xs text-fg-tertiary sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          {ORG.name}. MIT licensed, {new Date().getFullYear()}.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-6 items-center transition-colors duration-150 hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-6 items-center transition-colors duration-150 hover:text-fg"
          >
            GitHub
          </a>
          <a
            href="/changelog.xml"
            className="inline-flex min-h-6 items-center transition-colors duration-150 hover:text-fg"
          >
            RSS
          </a>
        </nav>
      </div>
    </footer>
  );
}
