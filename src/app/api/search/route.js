import { getSearchResults } from "@/features/game/queries";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function GET(request) {
  // Rate limiting: 30 requests per minute per IP
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`search:${clientIp}`, 30, 60000);

  if (!rateLimitResult.success) {
    return Response.json(
      { error: "Too many search requests. Please try again later." },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const trimmedQuery = typeof query === "string" ? query.trim() : "";

  if (!trimmedQuery) {
    return Response.json({ results: [] });
  }

  const results = await getSearchResults(trimmedQuery, { limit: 6 });

  return Response.json({ results }, {
    headers: getRateLimitHeaders(rateLimitResult),
  });
}