import Link from "next/link";

import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className={cn("size-6", className)}
    >
      <rect
        x="1.5"
        y="1.5"
        width="29"
        height="29"
        rx="8"
        className="fill-terminal stroke-border-strong"
        strokeWidth="1.5"
      />
      <path
        d="M9 11.5L14.5 16L9 20.5"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-[#34d399]"
      />
      <path
        d="M17 21.5H23"
        stroke="#e8ecf4"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2.5 font-mono text-[0.95rem] font-semibold tracking-tight text-foreground",
        className,
      )}
      aria-label="agentling home"
    >
      <LogoMark className="transition-transform duration-200 group-hover:-rotate-6" />
      <span>
        agent<span className="text-accent">ling</span>
      </span>
    </Link>
  );
}
