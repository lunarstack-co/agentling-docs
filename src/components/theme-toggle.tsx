"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  // resolvedTheme accounts for "system", so the compact toggle always flips
  // what the visitor is actually looking at.
  const isDark = mounted ? resolvedTheme === "dark" : true;

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <>
      {/* Mobile / Tablet compact 1-button toggle (32x32px) */}
      <button
        onClick={toggle}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={cn(
          "flex size-8 cursor-pointer items-center justify-center rounded border border-border text-muted-foreground hover:text-foreground hover:border-border-strong transition-colors sm:hidden",
          className
        )}
      >
        {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
      </button>

      {/* Desktop 3-option toggle pill */}
      <div
        role="radiogroup"
        aria-label="Theme"
        className={cn("hidden sm:flex items-center gap-0.5 rounded-full border border-border p-0.5", className)}
      >
        <button
          role="radio"
          aria-checked={mounted ? theme === "light" : false}
          aria-label="Light theme"
          onClick={() => setTheme("light")}
          className={cn(
            "flex size-6 cursor-pointer items-center justify-center rounded-full transition-colors duration-150",
            mounted && theme === "light"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Sun className="size-3" aria-hidden />
        </button>
        <button
          role="radio"
          aria-checked={mounted ? theme === "dark" : true}
          aria-label="Dark theme"
          onClick={() => setTheme("dark")}
          className={cn(
            "flex size-6 cursor-pointer items-center justify-center rounded-full transition-colors duration-150",
            mounted && theme === "dark"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Moon className="size-3" aria-hidden />
        </button>
        <button
          role="radio"
          aria-checked={mounted ? theme === "system" : false}
          aria-label="System theme"
          onClick={() => setTheme("system")}
          className={cn(
            "flex size-6 cursor-pointer items-center justify-center rounded-full transition-colors duration-150",
            mounted && theme === "system"
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Monitor className="size-3" aria-hidden />
        </button>
      </div>
    </>
  );
}
