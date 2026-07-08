"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface CodeTab {
  label: string;
  panel: ReactNode;
}

/**
 * Tab switcher whose panels are server-rendered (pre-highlighted markdown),
 * passed in as ReactNodes so no highlighting happens on the client.
 */
export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();

  return (
    <div>
      <div
        role="tablist"
        aria-label="Code examples"
        className="flex flex-wrap gap-1 rounded-full border border-border bg-card p-1"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            role="tab"
            id={`${baseId}-tab-${index}`}
            aria-selected={active === index}
            aria-controls={`${baseId}-panel-${index}`}
            onClick={() => setActive(index)}
            className={cn(
              "flex-1 cursor-pointer rounded-full px-4 py-1.5 font-mono text-xs font-medium transition-colors duration-150",
              active === index
                ? "bg-accent-soft text-accent"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${baseId}-panel-${index}`}
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={active !== index}
          className="mt-2"
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
