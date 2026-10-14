import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/docs/getting-started/introduction"
      className={cn(
        "group inline-flex items-center font-sans font-bold tracking-tight text-foreground text-base hover:opacity-90 transition-opacity",
        className,
      )}
      aria-label="Agentling"
    >
      <span>Agentling</span>
    </Link>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-sans font-bold tracking-tight text-foreground text-sm",
        className,
      )}
    >
      Agentling
    </span>
  );
}
