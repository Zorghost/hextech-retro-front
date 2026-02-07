import { NextResponse } from "next/server";

// Auth for /dashboard is enforced in the server layout at src/app/(admin)/dashboard/layout.jsx.
// Keep this middleware as a no-op so the app doesn't pull Node-only deps into the Edge runtime.
export const config = {
  // Only run on game pages; opt-in to COOP/COEP headers for threaded EmulatorJS cores.
  matcher: ["/game/:path*"],
};

export function middleware() {
  const response = NextResponse.next();

  // Needed for SharedArrayBuffer (threads). This can break some third-party embeds/resources.
  // Enable explicitly via env var.
  const enableThreadHeaders = String(process.env.NEXT_ENABLE_EJS_THREADS_HEADERS || "").toLowerCase() === "true";
  if (enableThreadHeaders) {
    response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  }

  return response;
}