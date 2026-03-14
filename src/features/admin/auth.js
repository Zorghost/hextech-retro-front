import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

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

export async function requireAdmin({ redirectTo = "/login" } = {}) {
  const session = await auth();
  const email = normalizeEmail(session?.user?.email);
  const role = session?.user?.role;

  if (!email) redirect(redirectTo);

  const allowlist = getAdminAllowlist();
  const isAdmin = role === "admin" || allowlist.includes(email);

  if (!isAdmin) redirect(redirectTo);

  return session;
}
