import { getDocPage } from "@/lib/content";
import { renderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image";
import { SITE_TAGLINE } from "@/lib/site";

export const alt = "agentling documentation";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ section: string; slug: string }>;
}) {
  const { slug } = await params;
  const page = await getDocPage(slug);

  if (!page) {
    return renderOgImage({
      eyebrow: "Documentation",
      title: "agentling docs",
      subtitle: SITE_TAGLINE,
    });
  }

  return renderOgImage({
    eyebrow: `Docs · ${page.sectionTitle}`,
    title: page.title,
    subtitle: page.description,
  });
}
