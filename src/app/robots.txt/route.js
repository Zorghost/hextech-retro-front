import { getRequestSiteUrl } from "@/lib/requestSiteUrl";

export const dynamic = "force-dynamic";

export function GET() {
  const siteUrl = getRequestSiteUrl();
  const robotsTxt = [
    "User-Agent: *",
    "Allow: /",
    `Host: ${siteUrl}`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}