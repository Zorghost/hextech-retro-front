import { getGameCategories, getPublishedGamesForSitemap } from "@/lib/gameQueries";
import { getSiteUrl } from "@/lib/siteUrl";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

function getOriginFromRequestHeaders() {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");

  const forwardedProto = h.get("x-forwarded-proto");
  const proto = (forwardedProto ? forwardedProto.split(",")[0] : null) || "https";

  if (!host) return null;
  return `${proto}://${host}`;
}

export default async function sitemap() {
  // IMPORTANT: Sitemap URLs must match the domain that serves the sitemap.
  // Prefer the canonical site URL configured in env; fallback to request headers when unset.
  const configuredSiteUrl = getSiteUrl();
  const headerSiteUrl = getOriginFromRequestHeaders();
  const siteUrl = configuredSiteUrl.includes("localhost") && headerSiteUrl ? headerSiteUrl : configuredSiteUrl;
  const [games, categories] = await Promise.all([
    getPublishedGamesForSitemap(),
    getGameCategories(),
  ]);

  const gameItems = games.map((item) => ({
    url: `${siteUrl}/game/${item.slug}`,
    lastModified: item.created_at,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const categoryItems = categories.map((category) => ({
    url: `${siteUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/category`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...categoryItems,
    ...gameItems,
  ];
}
