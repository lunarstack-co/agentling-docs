import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getDocSections } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Documentation",
  description:
    "Learn agentling: installation, the agent loop, tools, memory, streaming events, skills, and the full API reference.",
  path: "/docs",
});

export default async function DocsIndexPage() {
  const sections = await getDocSections();

  return (
    <div className="py-10 lg:py-14 lg:pl-12">
      <p className="font-mono text-xs font-semibold tracking-wider text-accent uppercase">
        Documentation
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Learn agentling
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
        Everything you need to build reliable, observable, tool-using agents:
        from your first install to the full API surface. The framework is a
        handful of focused modules you can read end to end, and these docs
        cover all of them.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.slug}
            href={`/docs/${section.slug}/${section.pages[0]?.slug ?? ""}`}
            className="group rounded-2xl border border-border bg-card p-6 transition-colors duration-150 hover:border-border-strong"
          >
            <h2 className="flex items-center justify-between text-base font-semibold text-foreground">
              {section.title}
              <ArrowRight
                className="size-4 text-faint transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-accent"
                aria-hidden
              />
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {section.description}
            </p>
            <p className="mt-4 font-mono text-xs text-faint">
              {section.pages.length} pages
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
