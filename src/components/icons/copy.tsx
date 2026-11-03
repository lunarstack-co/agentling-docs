import type { SVGProps } from "react";

/* Components for React, and markup strings for copy-code-buttons.tsx, which
   injects buttons into server-rendered HTML. Both share one set of paths. */

const SVG_ATTRS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const COPY_PATHS = {
  rect: { width: 12, height: 12, x: 9, y: 9, rx: 2 },
  path: "M5 15V5a2 2 0 0 1 2-2h10",
};
const CHECK_PATH = "M20 6 9 17l-5-5";

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...SVG_ATTRS} width="14" height="14" aria-hidden {...props}>
      <rect {...COPY_PATHS.rect} />
      <path d={COPY_PATHS.path} />
    </svg>
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...SVG_ATTRS} width="14" height="14" aria-hidden {...props}>
      <path d={CHECK_PATH} />
    </svg>
  );
}

const OPEN = `<svg viewBox="${SVG_ATTRS.viewBox}" fill="none" stroke="currentColor" stroke-width="${SVG_ATTRS.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true">`;
const { rect } = COPY_PATHS;

export const COPY_ICON_HTML = `${OPEN}<rect width="${rect.width}" height="${rect.height}" x="${rect.x}" y="${rect.y}" rx="${rect.rx}"/><path d="${COPY_PATHS.path}"/></svg>`;
export const CHECK_ICON_HTML = `${OPEN}<path d="${CHECK_PATH}"/></svg>`;
