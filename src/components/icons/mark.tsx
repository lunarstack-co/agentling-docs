import type { SVGProps } from "react";

/**
 * The Agentling mark: a lowercase a whose stroke runs on along the baseline
 * and out of the loop. One shape in the current text colour. This is the
 * small-size cut on a 256-unit grid; src/app/icon.svg and
 * scripts/generate-icons.mjs use the same geometry, so keep the three in step.
 */
export function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" aria-hidden {...props}>
      <path d="M97.5 197Q68.09 197 47.3 176.2Q26.5 155.41 26.5 126Q26.5 96.59 47.3 75.8Q68.09 55 97.5 55L147.5 55C159.1 55 168.5 64.4 168.5 76L168.5 155L208.5 155C220.1 155 229.5 164.4 229.5 176C229.5 187.6 220.1 197 208.5 197ZM126.5 126Q126.5 113.99 118.01 105.49Q109.51 97 97.5 97Q85.49 97 76.99 105.49Q68.5 113.99 68.5 126Q68.5 138.01 76.99 146.51Q85.49 155 97.5 155L126.5 155Z" />
    </svg>
  );
}
