import Link from "next/link";

import { Logo } from "@/components/logo";
import { GITHUB_DOCS_URL, GITHUB_URL, PYPI_URL } from "@/lib/site";

const COLUMNS: {
  heading: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    heading: "Documentation",
    links: [
      { label: "Introduction", href: "/docs/getting-started/introduction" },
      { label: "Quickstart", href: "/docs/getting-started/quickstart" },
      { label: "Core concepts", href: "/docs/core-concepts/agent-loop" },
      { label: "API reference", href: "/docs/reference/agent-api" },
    ],
  },
  {
    heading: "Project",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
      { label: "Contributing", href: "/contributing" },
      { label: "Docs source", href: GITHUB_DOCS_URL, external: true },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "GitHub", href: GITHUB_URL, external: true },
      { label: "Issues", href: `${GITHUB_URL}/issues`, external: true },
      { label: "PyPI", href: PYPI_URL, external: true },
      {
        label: "Security policy",
        href: `${GITHUB_URL}/blob/main/SECURITY.md`,
        external: true,
      },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      {
        label: "MIT license",
        href: `${GITHUB_URL}/blob/main/LICENSE`,
        external: true,
      },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A tiny async framework for reliable, observable, tool-using
              agents. Small enough to read in one sitting.
            </p>
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.heading} aria-label={column.heading}>
              <h2 className="font-mono text-xs font-semibold tracking-wider text-faint uppercase">
                {column.heading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            MIT licensed. Copyright {new Date().getFullYear()} Folarin
            Akinloye.
          </p>
          <p className="font-mono">pip install agentling</p>
        </div>
      </div>
    </footer>
  );
}
