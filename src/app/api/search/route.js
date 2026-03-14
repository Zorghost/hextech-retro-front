import { getSearchResults } from "@/features/game/queries";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const trimmedQuery = typeof query === "string" ? query.trim() : "";

  if (!trimmedQuery) {
    return Response.json({ results: [] });
  }

  const results = await getSearchResults(trimmedQuery, { limit: 6 });

  return Response.json({ results });
}