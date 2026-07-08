import { getDocSections } from "@/lib/content";
import { renderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image";

export const alt = "agentling documentation";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const sections = await getDocSections();
  const pageCount = sections.reduce(
    (total, section) => total + section.pages.length,
    0,
  );

  return renderOgImage({
    eyebrow: "Documentation",
    title: "Learn agentling",
    subtitle: `${pageCount} pages: from your first install to the full API surface.`,
  });
}
