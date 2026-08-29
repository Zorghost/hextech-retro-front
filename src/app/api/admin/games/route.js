import { createGame } from "@/app/(admin)/dashboard/game/(form)/actions";
import { auth } from "@/app/auth";
import { isAdminSession } from "@/features/admin/auth";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(request) {
  const session = await auth();

  if (!isAdminSession(session)) {
    return Response.json(
      {
        status: "error",
        message: "Unauthorized",
        color: "red",
      },
      { status: 401 },
    );
  }

  // Rate limiting: 5 game creation requests per minute per admin
  const clientIp = getClientIp(request);
  const rateLimitKey = `admin:games:${session.user.id || clientIp}`;
  const rateLimitResult = await checkRateLimit(rateLimitKey, 5, 60000);

  if (!rateLimitResult.success) {
    return Response.json(
      {
        status: "error",
        message: "Too many game creation requests. Please try again later.",
        color: "red",
      },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const formData = await request.formData();
  const result = await createGame({ message: null }, formData, { skipAdminCheck: true });

  const statusCode = result?.status === "success" ? 200 : 400;
  return Response.json(result, {
    status: statusCode,
    headers: getRateLimitHeaders(rateLimitResult),
  });
}
