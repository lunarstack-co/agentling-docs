"use client";

import { FileText, Search as SearchIcon, Tag } from "lucide-react";
import MiniSearch from "minisearch";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";

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

const emptySubscribe = () => () => {};

let enginePromise: Promise<MiniSearch<SearchItem>> | null = null;

function loadEngine(): Promise<MiniSearch<SearchItem>> {
  enginePromise ??= fetch("/search-index.json")
    .then((response) => response.json())
    .then((documents: (SearchItem & { id: string })[]) => {
      const engine = new MiniSearch<SearchItem>({
        fields: ["title", "headings", "description", "body"],
        storeFields: ["title", "description", "href", "group"],
        searchOptions: {
          boost: { title: 5, headings: 3, description: 2 },
          prefix: true,
          fuzzy: 0.15,
        },
      });
      engine.addAll(documents);
      return engine;
    })
    .catch((error) => {
      enginePromise = null;
      throw error;
    });
  return enginePromise;
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
  if (group === "Changelog") return Tag;
  return FileText;
}

export function SearchDialog({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [engine, setEngine] = useState<MiniSearch<SearchItem> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || engine) return;
    let cancelled = false;
    loadEngine()
      .then((loaded) => {
        if (!cancelled) setEngine(loaded);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, engine]);

  const results = useMemo<ScoredItem[]>(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return items.slice(0, 8).map((item) => ({ ...item, score: 0 }));
    }
    if (engine) {
      return engine.search(trimmed).slice(0, 10).map((result) => ({
        title: result.title as string,
        description: result.description as string,
        href: result.href as string,
        group: result.group as string,
        score: result.score,
      }));
    }
    return items
      .map((item) => ({ ...item, score: scoreItem(item, trimmed) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [items, query, engine]);

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
      if (event.key === "/" && !["INPUT", "TEXTAREA"].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

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

  const modalNode = (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[10vh] sm:pt-[14vh]"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        className="w-full max-w-[640px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl transition-all"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search documentation..."
            aria-label="Search query"
            data-focus-ring="none"
            className="h-7 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-faint font-sans"
          />
          <kbd className="shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-faint">
            esc
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 divide-y divide-border/30"
        >
          {results.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <p>No results found for &ldquo;{query}&rdquo;</p>
              <p className="mt-1 text-faint">Try searching for an API method or concept</p>
            </div>
          ) : (
            results.map((item, index) => {
              const Icon = groupIcon(item.group);
              const isSelected = index === activeIndex;
              return (
                <button
                  key={item.href}
                  onClick={() => select(item.href)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors duration-100",
                    isSelected
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 mt-0.5",
                      isSelected ? "text-accent" : "text-faint",
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium truncate",
                          isSelected ? "text-foreground font-semibold" : "text-foreground",
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="font-mono text-[10px] text-faint shrink-0">
                        {item.group}
                      </span>
                    </div>
                    {item.description && (
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between border-t border-border px-4 py-2 font-mono text-[10px] text-faint bg-muted/40">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Open</span>
          </div>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Icon-only button below sm; a full-width field from sm up. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Search documentation"
        className="group flex size-8 cursor-pointer items-center justify-center rounded border border-border bg-card text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground sm:h-8.5 sm:w-full sm:justify-between sm:px-3"
      >
        <div className="flex items-center gap-2">
          <SearchIcon className="size-3.5 text-faint group-hover:text-muted-foreground transition-colors" aria-hidden />
          <span className="hidden sm:inline whitespace-nowrap font-normal">Search docs...</span>
        </div>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-faint">
          ⌘K
        </kbd>
      </button>

      {open && mounted && createPortal(modalNode, document.body)}
    </>
  );
}
