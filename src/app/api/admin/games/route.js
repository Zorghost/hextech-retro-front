import { createGame } from "@/app/(admin)/dashboard/game/(form)/actions";
import { auth } from "@/app/auth";

export const runtime = "nodejs";

const DEFAULT_ADMIN_EMAIL_ALLOWLIST = ["admin@admin.com"];

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getAdminAllowlist() {
  const fromEnv = process.env.NEXT_ADMIN_EMAILS;
  if (!fromEnv) return DEFAULT_ADMIN_EMAIL_ALLOWLIST;

  return fromEnv
    .split(",")
    .map((email) => normalizeEmail(email))
    .filter(Boolean);
}

function isAdminSession(session) {
  const email = normalizeEmail(session?.user?.email);
  const role = session?.user?.role;
  if (!email) return false;

  const allowlist = getAdminAllowlist();
  return role === "admin" || allowlist.includes(email);
}

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
