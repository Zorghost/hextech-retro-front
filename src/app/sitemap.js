import { getGameCategories, getPublishedGamesForSitemap } from "@/lib/gameQueries";
import { getSiteUrl } from "@/lib/siteUrl";

export const dynamic = "force-dynamic";

export default async function sitemap() {
  const siteUrl = getSiteUrl();
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
