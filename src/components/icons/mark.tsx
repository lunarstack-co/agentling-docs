import type { SVGProps } from "react";

import { MARK_PATH } from "@/lib/brand-mark";

/** The Agentling mark as one shape in the current text colour. */
export function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden {...props}>
      <path d={MARK_PATH} />
    </svg>
  );
}
