import { renderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image";
import { SITE_TAGLINE } from "@/lib/site";

export const alt = `agentling: ${SITE_TAGLINE}`;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Agent framework for Python",
    title: "The agent framework you can read in one sitting",
    subtitle: SITE_TAGLINE,
  });
}
