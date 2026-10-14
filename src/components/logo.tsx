import Link from "next/link";

import { Mark } from "@/components/icons/mark";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/docs/getting-started/introduction"
      className={cn(
        "inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-fg transition-opacity duration-150 hover:opacity-80",
        className,
      )}
      aria-label="Agentling"
    >
      <Mark className="size-[18px]" />
      Agentling
    </Link>
  );
}
