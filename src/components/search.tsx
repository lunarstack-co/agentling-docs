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
    .then((response) => {
      if (!response.ok) throw new Error(`search index ${response.status}`);
      return response.json();
    })
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
  if (item.title.toLowerCase().startsWith(q)) return 4;
  if (item.title.toLowerCase().includes(q)) return 3;
  if (item.group.toLowerCase().includes(q)) return 2;
  if (item.description.toLowerCase().includes(q)) return 1;
  return 0;
}

export function SearchDialog({ items }: { items: SearchItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const isMac = useSyncExternalStore(
    emptySubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform),
    () => true,
  );
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [engine, setEngine] = useState<MiniSearch<SearchItem> | null>(null);
  const [engineFailed, setEngineFailed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || engine) return;
    let cancelled = false;
    loadEngine()
      .then((loaded) => {
        if (!cancelled) setEngine(loaded);
      })
      .catch(() => {
        if (!cancelled) setEngineFailed(true);
      });
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
    triggerRef.current?.focus();
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
      const target = event.target as HTMLElement | null;
      const typing =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      } else if (event.key === "/" && !typing) {
        event.preventDefault();
        setOpen(true);
      } else if (event.key === "Escape" && open) {
        event.preventDefault();
        close();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setActiveIndex(0);
  }

  // Keep the selected row in view when navigating with the keyboard.
  useEffect(() => {
    const row = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    row?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

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
    } else if (event.key === "Tab") {
      // Keep focus inside the dialog; the input is its only field.
      event.preventDefault();
    }
  }

  const trimmed = query.trim();

  const modalNode = (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-base/80 px-4 pb-4 pt-[12vh]"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search documentation"
        className="w-full max-w-[600px] overflow-hidden rounded-panel bg-raised shadow-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex h-12 items-center gap-2.5 border-b border-border-subtle px-4">
          <SearchIcon className="size-[15px] shrink-0 text-fg-tertiary" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search documentation"
            aria-label="Search query"
            aria-controls="search-results"
            aria-activedescendant={results[activeIndex] ? `search-option-${activeIndex}` : undefined}
            role="combobox"
            aria-expanded="true"
            autoComplete="off"
            spellCheck={false}
            data-focus-ring="none"
            className="h-8 w-full min-w-0 bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-tertiary"
          />
          <kbd className="shrink-0">esc</kbd>
        </div>

        <div
          ref={listRef}
          id="search-results"
          role="listbox"
          aria-label="Results"
          className="max-h-[360px] overflow-y-auto p-1.5"
        >
          {engineFailed && trimmed ? (
            <p className="px-4 py-8 text-center text-fg-secondary">
              Search is unavailable right now. Use the sidebar to find a page.
            </p>
          ) : results.length === 0 ? (
            <div className="px-4 py-8 text-center text-fg-secondary">
              <p className="font-medium text-fg">Nothing matches &ldquo;{trimmed}&rdquo;</p>
              <p className="mt-1">
                Search by class or method name, like AgentSession or run().
              </p>
            </div>
          ) : (
            results.map((item, index) => {
              const Icon = item.group === "Changelog" ? Tag : FileText;
              const selected = index === activeIndex;
              return (
                <button
                  key={item.href}
                  id={`search-option-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={selected}
                  tabIndex={-1}
                  onClick={() => select(item.href)}
                  onMouseMove={() => setActiveIndex(index)}
                  className={cn(
                    "flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-control px-2.5 text-left text-ui",
                    selected ? "bg-sunken" : "hover:bg-sunken/60",
                  )}
                >
                  <Icon className="size-3.5 shrink-0 text-fg-tertiary" aria-hidden />
                  <span className="min-w-0 flex-1 truncate font-medium text-fg">
                    {item.title}
                  </span>
                  <span className="shrink-0 font-mono text-2xs text-fg-tertiary">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex h-9 items-center gap-4 border-t border-border-subtle bg-sunken px-4 text-xs text-fg-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="bg-raised">↑</kbd>
            <kbd className="bg-raised">↓</kbd>
            <span className="ml-1">navigate</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-raised">↵</kbd>
            <span className="ml-1">open</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Icon-only below sm, a field from sm up. */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search documentation"
        aria-keyshortcuts={isMac ? "Meta+K" : "Control+K"}
        className="group flex size-8 cursor-pointer items-center justify-center gap-2 rounded-control border border-border-default bg-raised text-ui text-fg-tertiary transition-[border-color,color,transform] duration-150 ease-out hover:border-fg-tertiary hover:text-fg active:scale-[0.98] active:duration-100 sm:w-full sm:justify-start sm:px-2.5"
      >
        <SearchIcon className="size-3.5 shrink-0" aria-hidden />
        <span className="hidden whitespace-nowrap sm:inline">Search docs</span>
        <kbd className="ml-auto hidden sm:inline-block">{isMac ? "⌘K" : "Ctrl K"}</kbd>
      </button>

      {open && mounted && createPortal(modalNode, document.body)}
    </>
  );
}
