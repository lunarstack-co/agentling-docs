import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/docs/getting-started/introduction"
      className={cn(
        "inline-flex items-center text-[15px] font-semibold tracking-[-0.01em] text-fg transition-opacity duration-150 hover:opacity-80",
        className,
      )}
      aria-label="Agentling"
    >
      Agentling
    </Link>
  );
}
