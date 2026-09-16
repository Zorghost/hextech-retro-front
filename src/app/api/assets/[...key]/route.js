import { getGcsObject } from "@/lib/gcsStorage";

export const runtime = "nodejs";

// This is intentionally NOT a general purpose proxy.
// Only allow known public asset prefixes to prevent open-proxy abuse.
const ALLOWED_TOP_LEVEL_PREFIXES = new Set(["category", "thumbnail", "rom"]);

export async function GET(_request, { params }) {
  try {
    const keyParts = Array.isArray(params?.key) ? params.key : [params?.key].filter(Boolean);

    if (keyParts.length < 2) {
      return new Response("Not found", { status: 404 });
    }

    if (keyParts.some((part) => part === ".." || part.includes(".."))) {
      return new Response("Bad request", { status: 400 });
    }

    const topLevel = keyParts[0];
    if (!ALLOWED_TOP_LEVEL_PREFIXES.has(topLevel)) {
      return new Response("Not found", { status: 404 });
    }

    const objectKey = keyParts.join("/");

    const result = await getGcsObject(objectKey);

    const headers = new Headers();
    if (result.contentType) headers.set("Content-Type", result.contentType);

    // Cache successful responses for a while, but avoid treating them as immutable if the
    // underlying object may change or the same key is re-used during replacement operations.
    headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");

    return new Response(result.body, { status: 200, headers });
  } catch (error) {
    // Avoid leaking credentials/config; log server-side.
    console.error("GCS asset proxy error", { message: error?.message });

    // Common cases:
    // - NotFound => 404
    // - Invalid credentials or permissions => 502
    // - Any other upstream error => 502
    const message = (error?.name || "").toString();
    if (message === "NoSuchKey" || message === "NotFound" || error?.code === 404) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      });
    }

    return new Response("Upstream error", {
      status: 502,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }
}
