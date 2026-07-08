"use client";

import { FileText, Newspaper, Search as SearchIcon, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

export interface SearchItem {
  title: string;
  description: string;
  href: string;
  group: string;
}

interface ScoredItem extends SearchItem {
  score: number;
}

function scoreItem(item: SearchItem, query: string): number {
  const q = query.toLowerCase();
  const title = item.title.toLowerCase();
  const description = item.description.toLowerCase();
  const group = item.group.toLowerCase();

  if (title.startsWith(q)) return 4;
  if (title.includes(q)) return 3;
  if (group.includes(q)) return 2;
  if (description.includes(q)) return 1;
  return 0;
}

function groupIcon(group: string) {
  if (group === "Blog") return Newspaper;
  if (group === "Changelog") return Tag;
  return FileText;
}

export function SearchDialog({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo<ScoredItem[]>(() => {
    if (!query.trim()) {
      return items.slice(0, 8).map((item) => ({ ...item, score: 0 }));
    }
    return items
      .map((item) => ({ ...item, score: scoreItem(item, query.trim()) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const select = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Reset the highlighted row whenever the query changes, adjusting state
  // during render instead of in an effect.
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setActiveIndex(0);
  }

  function onInputKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      select(results[activeIndex].href);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search documentation"
        className="flex h-9 cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3.5 text-sm text-muted-foreground transition-colors duration-150 hover:border-border-strong hover:text-foreground"
      >
        <SearchIcon className="size-3.5" aria-hidden />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search docs, blog, changelog..."
                aria-label="Search query"
                data-focus-ring="none"
                className="h-13 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint"
              />
              <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                esc
              </kbd>
            </div>

            <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </p>
              ) : (
                results.map((item, index) => {
                  const Icon = groupIcon(item.group);
                  return (
                    <button
                      key={item.href}
                      onClick={() => select(item.href)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-100",
                        index === activeIndex ? "bg-muted" : "bg-transparent",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          index === activeIndex ? "text-accent" : "text-faint",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {item.title}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {item.group}
                          {item.description ? ` · ${item.description}` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
