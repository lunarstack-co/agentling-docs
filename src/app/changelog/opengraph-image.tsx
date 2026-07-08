import { getChangelog } from "@/lib/content";
import { renderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og-image";
import { formatDate } from "@/lib/utils";

export const alt = "agentling changelog";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const [latest] = await getChangelog();

  return renderOgImage({
    eyebrow: "Changelog",
    title: "What shipped, release by release",
    subtitle: latest
      ? `Latest: v${latest.version}, released ${formatDate(latest.releaseDate)}.`
      : undefined,
  });
}
