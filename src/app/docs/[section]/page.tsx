import { notFound, permanentRedirect } from "next/navigation";

import { getDocSections } from "@/lib/content";

/** /docs/<section> is a natural URL to type; send it to the section's first page. */
export default async function SectionIndexPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: sectionSlug } = await params;
  const section = (await getDocSections()).find((s) => s.slug === sectionSlug);
  const first = section?.pages[0];
  if (!section || !first) notFound();
  permanentRedirect(`/docs/${section.slug}/${first.slug}`);
}
