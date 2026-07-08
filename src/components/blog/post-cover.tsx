import { LogoMark } from "@/components/logo";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-emerald-500/25 via-teal-500/15 to-transparent",
  "from-sky-500/25 via-indigo-500/15 to-transparent",
  "from-amber-500/25 via-orange-500/15 to-transparent",
  "from-fuchsia-500/25 via-purple-500/15 to-transparent",
];

function hashSlug(slug: string): number {
  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }
  return hash;
}

/**
 * Deterministic decorative cover so every post gets a stable, distinct
 * header without needing image assets in the CMS.
 */
export function PostCover({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const gradient = GRADIENTS[hashSlug(slug) % GRADIENTS.length];

  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-xl border border-border bg-card",
        className,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      <div className="bg-grid absolute inset-0 opacity-60" />
      <LogoMark className="relative size-10 opacity-90" />
    </div>
  );
}
