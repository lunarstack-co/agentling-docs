import { getSearchDocuments } from "@/lib/content/search";

export const dynamic = "force-static";

export async function GET() {
  const documents = await getSearchDocuments();
  return Response.json(documents, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
