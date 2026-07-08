import type { Element, Root, Text } from "hast";

const CALLOUT_TYPES: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
};

const MARKER = /^\[!(note|tip|important|warning|caution)\]\s*/i;

/**
 * Turns GitHub-style alert blockquotes into styled callouts:
 *
 *   > [!NOTE]
 *   > Body text.
 *
 * becomes `<div class="callout" data-callout="note">` with a title row,
 * styled per type in globals.css.
 */
export function rehypeCallouts() {
  return (tree: Root) => {
    walk(tree as unknown as Element);
  };
}

function walk(node: Element | Root): void {
  if (!("children" in node)) return;
  for (const child of node.children) {
    if (child.type !== "element") continue;
    if (child.tagName === "blockquote") transformBlockquote(child);
    walk(child);
  }
}

function transformBlockquote(blockquote: Element): void {
  const firstParagraph = blockquote.children.find(
    (child): child is Element =>
      child.type === "element" && child.tagName === "p",
  );
  if (!firstParagraph) return;

  const firstText = firstParagraph.children.find(
    (child): child is Text => child.type === "text",
  );
  if (!firstText) return;

  const match = firstText.value.match(MARKER);
  if (!match) return;

  const type = match[1].toLowerCase();

  // Strip the marker; drop the text node (and paragraph) if now empty.
  firstText.value = firstText.value.replace(MARKER, "").replace(/^\n/, "");
  if (firstText.value.trim() === "") {
    firstParagraph.children = firstParagraph.children.filter(
      (child) => child !== firstText,
    );
  }
  if (firstParagraph.children.length === 0) {
    blockquote.children = blockquote.children.filter(
      (child) => child !== firstParagraph,
    );
  }

  const title: Element = {
    type: "element",
    tagName: "p",
    properties: { className: ["callout-title"] },
    children: [{ type: "text", value: CALLOUT_TYPES[type] }],
  };

  blockquote.tagName = "div";
  blockquote.properties = {
    className: ["callout"],
    dataCallout: type,
  };
  blockquote.children = [title, ...blockquote.children];
}
