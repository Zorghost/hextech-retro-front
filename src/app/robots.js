import { getSiteUrl } from "@/lib/siteUrl";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function getOriginFromRequestHeaders() {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");

  const forwardedProto = h.get("x-forwarded-proto");
  const proto = (forwardedProto ? forwardedProto.split(",")[0] : null) || "https";

  if (!host) return getSiteUrl();
  return `${proto}://${host}`;
}

export default function robots() {
  const siteUrl = getOriginFromRequestHeaders();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
