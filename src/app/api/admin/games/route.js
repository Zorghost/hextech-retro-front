import { createGame } from "@/app/(admin)/dashboard/game/(form)/actions";
import { auth } from "@/app/auth";
import { isAdminSession } from "@/features/admin/auth";

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

  const formData = await request.formData();
  const result = await createGame({ message: null }, formData, { skipAdminCheck: true });

  const statusCode = result?.status === "success" ? 200 : 400;
  return Response.json(result, { status: statusCode });
}
