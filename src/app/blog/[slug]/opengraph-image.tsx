import { getBlogPost } from "@/lib/content";
import { renderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image";
import { SITE_TAGLINE } from "@/lib/site";
import { formatDate } from "@/lib/utils";

export const alt = "agentling blog post";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return renderOgImage({
      eyebrow: "Blog",
      title: "agentling",
      subtitle: SITE_TAGLINE,
    });
  }

  return renderOgImage({
    eyebrow: `Blog · ${formatDate(post.publishDate)}`,
    title: post.title,
    subtitle: post.excerpt,
  });
}
