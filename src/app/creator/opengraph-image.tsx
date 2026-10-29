import { renderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image";
import { AUTHOR } from "@/lib/site";

export const alt = `${AUTHOR.name}, AI Engineer and Creator of Agentling`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

/** Typographic card: the name and the role line, no imagery. */
export default function Image() {
  return renderOgImage({
    eyebrow: "AI Engineer · Creator of Agentling",
    title: AUTHOR.name,
    subtitle:
      "Builds agentic systems and AI-powered products. Creator of Agentling, an open-source Python framework for building AI agents.",
    footerNote: "folarin.dev",
  });
}
