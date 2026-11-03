"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon, CopyIcon } from "@/components/icons/copy";

const COPIED_FOR_MS = 2000;

/** The install command in a code block, with a button that copies it. */
export function InstallCommand({
  command,
  alternative,
}: {
  command: string;
  alternative: string;
}) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timeout.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
    } catch {
      // Clipboard access denied; leave the button as it was.
      return;
    }
    setCopied(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), COPIED_FOR_MS);
  }

  const label = copied ? "Copied" : "Copy install command";

  return (
    <div>
      <div className="relative rounded-control border border-code-border bg-code py-3 pl-4 pr-14">
        <code className="block overflow-x-auto whitespace-nowrap font-mono text-md text-code-fg">
          {command}
        </code>
        {/* Always visible, unlike the hover-only code-block buttons. */}
        <button
          type="button"
          data-copy-button=""
          onClick={copy}
          aria-label={label}
          title={label}
          style={{ opacity: 1 }}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
        <span role="status" className="sr-only">
          {copied ? "Copied to the clipboard" : ""}
        </span>
      </div>
      <p className="mt-2 text-ui text-fg-tertiary">{alternative}</p>
    </div>
  );
}
