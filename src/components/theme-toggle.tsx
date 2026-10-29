"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

const OPTIONS = [
  { value: "light", label: "Light theme", Icon: Sun },
  { value: "dark", label: "Dark theme", Icon: Moon },
  { value: "system", label: "System theme", Icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  // resolvedTheme accounts for "system", so the compact toggle always flips
  // what the visitor is actually looking at.
  const isDark = mounted ? resolvedTheme === "dark" : true;

  return (
    <>
      {/* Below sm: one button that flips the resolved theme. */}
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
        className={buttonClass({ variant: "outline", icon: true, className: cn("sm:hidden", className) })}
      >
        {isDark ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
      </button>

      {/* From sm: segmented control. */}
      <div
        role="radiogroup"
        aria-label="Theme"
        className={cn(
          "hidden h-8 items-center gap-0.5 rounded-control border border-border-default bg-raised p-0.5 sm:flex",
          className,
        )}
      >
        {OPTIONS.map(({ value, label, Icon }) => {
          const checked = mounted ? theme === value : value === "dark";
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={label}
              onClick={() => setTheme(value)}
              className={cn(
                "flex size-6 cursor-pointer items-center justify-center rounded-[3px] transition-[background-color,color] duration-150",
                checked ? "bg-sunken text-fg" : "text-fg-tertiary hover:text-fg",
              )}
            >
              <Icon className="size-3" aria-hidden />
            </button>
          );
        })}
      </div>
    </>
  );
}
