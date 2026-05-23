import { getRequestHost, getRequestSiteUrl } from "@/lib/requestSiteUrl";

export const dynamic = "force-dynamic";

export function GET() {
  const siteUrl = getRequestSiteUrl();
  const host = getRequestHost();
  const robotsTxt = [
    "User-Agent: *",
    "Allow: /",
    host ? `Host: ${host}` : null,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}