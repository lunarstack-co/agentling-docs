"use client";

import { useEffect } from "react";

import { CHECK_ICON_HTML, COPY_ICON_HTML } from "@/components/icons/copy";

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
      button.innerHTML = COPY_ICON_HTML;

      let timeout: ReturnType<typeof setTimeout> | undefined;
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(pre.innerText.trimEnd());
          button.innerHTML = CHECK_ICON_HTML;
          button.setAttribute("aria-label", "Copied");
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => {
            button.innerHTML = COPY_ICON_HTML;
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
