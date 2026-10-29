"use client";

import { useEffect } from "react";

const CHECK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;
const COPY_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><rect width="12" height="12" x="9" y="9" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>`;

/**
 * Adds a copy button to every server-rendered code block after hydration.
 * The button is styled by the [data-copy-button] rules in globals.css.
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
      button.type = "button";
      button.setAttribute("data-copy-button", "");
      button.setAttribute("aria-label", "Copy code");
      button.setAttribute("title", "Copy code");
      button.innerHTML = COPY_ICON;

      let timeout: ReturnType<typeof setTimeout> | undefined;
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText.trimEnd());
          button.innerHTML = CHECK_ICON;
          button.setAttribute("aria-label", "Copied");
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            button.innerHTML = COPY_ICON;
            button.setAttribute("aria-label", "Copy code");
          }, 1600);
        } catch {
          // Clipboard access denied; leave the button as-is.
        }
      };

      button.addEventListener("click", onClick);
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
