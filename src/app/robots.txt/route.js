import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

export function GET() {
  const siteUrl = getSiteUrl();
  const robotsTxt = [
    "User-Agent: *",
    "Allow: /",
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