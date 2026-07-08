"use client";

import { useEffect } from "react";

const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
const COPY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

/**
 * Progressively enhances rendered markdown with a copy button on every code
 * block. The markdown itself is server-rendered HTML, so the button has to
 * be attached after hydration.
 */
export function CopyCodeButtons() {
  useEffect(() => {
    const figures = document.querySelectorAll<HTMLElement>(
      "[data-markdown-root] [data-rehype-pretty-code-figure]",
    );
    const cleanups: (() => void)[] = [];

    figures.forEach((figure) => {
      if (figure.querySelector("[data-copy-button]")) return;
      const pre = figure.querySelector("pre");
      if (!pre) return;

      const button = document.createElement("button");
      button.setAttribute("data-copy-button", "");
      button.setAttribute("aria-label", "Copy code");
      button.setAttribute("title", "Copy code");
      button.className =
        "absolute right-2.5 top-2.5 flex size-8 cursor-pointer items-center justify-center rounded-md border border-code-border bg-code-bg text-muted-foreground opacity-0 transition-opacity duration-150 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100";
      button.innerHTML = COPY_ICON;

      let timeout: ReturnType<typeof setTimeout> | undefined;
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText.trimEnd());
          button.innerHTML = CHECK_ICON;
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            button.innerHTML = COPY_ICON;
          }, 1600);
        } catch {
          // Clipboard access denied; leave the button as-is.
        }
      };

      button.addEventListener("click", onClick);
      figure.classList.add("group");
      figure.appendChild(button);

      cleanups.push(() => {
        if (timeout) clearTimeout(timeout);
        button.removeEventListener("click", onClick);
        button.remove();
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return null;
}
