import { getSitePage } from "@/lib/content";
import { renderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image";
import { SITE_TAGLINE } from "@/lib/site";

export const alt = "agentling";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getSitePage(slug);

  if (!page) {
    return renderOgImage({
      eyebrow: "agentling",
      title: "The agent framework you can read in one sitting",
      subtitle: SITE_TAGLINE,
    });
  }

  return renderOgImage({
    eyebrow: "agentling",
    title: page.title,
    subtitle: page.description,
  });
}
