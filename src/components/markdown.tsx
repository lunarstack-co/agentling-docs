import { renderMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";

import { CopyCodeButtons } from "./copy-code-buttons";

export async function Markdown({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  const html = await renderMarkdown(source);
  return (
    <>
      <div
        data-markdown-root
        className={cn(
          "prose max-w-none",
          className,
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <CopyCodeButtons />
    </>
  );
}
