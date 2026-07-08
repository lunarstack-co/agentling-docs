import { renderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image";

export const alt = "agentling blog";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return renderOgImage({
    eyebrow: "Blog",
    title: "News and engineering notes",
    subtitle:
      "Release announcements, design write-ups, and honest notes from building a small agent framework.",
  });
}
