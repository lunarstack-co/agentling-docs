import type { SVGProps } from "react";

/**
 * The Agentling mark: three bars of decreasing length, a run as a list of
 * typed steps with the last one the answer. Neutral bars take the current
 * text colour; the last bar takes the accent. Drawn on a 32-unit grid.
 * The source of truth for the favicon set is src/app/icon.svg and the
 * generator in scripts/generate-icons.mjs; keep the geometry identical.
 */
export function Mark({
  accent = "var(--accent)",
  ...props
}: SVGProps<SVGSVGElement> & { accent?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden {...props}>
      <rect x="7" y="7" width="18" height="4" rx="2" fill="currentColor" />
      <rect x="7" y="14" width="12" height="4" rx="2" fill="currentColor" />
      <rect x="7" y="21" width="6" height="4" rx="2" fill={accent} />
    </svg>
  );
}
