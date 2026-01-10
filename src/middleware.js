import { NextResponse } from "next/server";

// Auth for /dashboard is enforced in the server layout at src/app/(admin)/dashboard/layout.jsx.
// Keep this middleware as a no-op so the app doesn't pull Node-only deps into the Edge runtime.
export const config = {
  matcher: ["/__middleware_disabled__"],
};

export function middleware() {
  return NextResponse.next();
}