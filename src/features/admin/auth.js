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

export function isAdminEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  return getAdminAllowlist().includes(normalizedEmail);
}

export function isAdminSession(session) {
  const email = normalizeEmail(session?.user?.email);
  const role = session?.user?.role;

  if (!email) return false;

  const allowlist = getAdminAllowlist();
  return role === "admin" || allowlist.includes(email);
}

export async function requireAdmin({ redirectTo = "/login" } = {}) {
  const session = await auth();
  if (!isAdminSession(session)) redirect(redirectTo);

  return session;
}
