import HeroSlider from "@/components/Sliders/HeroSlider";
import CategorySlider from "@/components/Sliders/CategorySlider";
import GameCategory from "@/components/GameCategory";
import {
  getGameCategories,
  getHomepageEditorPicks,
  getHomepagePlatformSpotlights,
  getHomepagePopularThisWeek,
  getHomepageRecentlyAdded,
  getRandomPublishedGames,
} from "@/lib/gameQueries";

function dedupeRail(section, excludedIds) {
  if (!section) {
    return null;
  }

  const games = [];

  for (const game of section.games ?? []) {
    if (excludedIds.has(game.id)) {
      continue;
    }

    excludedIds.add(game.id);
    games.push(game);
  }

  return {
    ...section,
    games,
  };
}

export default async function Home() {
  const [allCategoreis, discoverSection, recentlyAddedSection, popularThisWeekSection, platformSpotlights, editorPicksSection] = await Promise.all([
    getGameCategories(6),
    getRandomPublishedGames(8),
    getHomepageRecentlyAdded(8),
    getHomepagePopularThisWeek(8),
    getHomepagePlatformSpotlights(2, 4),
    getHomepageEditorPicks(8),
  ]);

  const seenGameIds = new Set();
  const recentlyAdded = dedupeRail(recentlyAddedSection, seenGameIds);
  const popularThisWeek = dedupeRail(popularThisWeekSection, seenGameIds);
  const editorPicks = dedupeRail(editorPicksSection, seenGameIds);
  const discover = dedupeRail(discoverSection, seenGameIds);

  return (
    <>
      <HeroSlider />
      <CategorySlider categories={allCategoreis} />
      {recentlyAdded?.games?.length ? <GameCategory category={recentlyAdded} /> : null}
      {popularThisWeek?.games?.length ? <GameCategory category={popularThisWeek} /> : null}
      {platformSpotlights.length ? (
        <section className="mb-6">
          <h2 className="font-display mb-4">Platform spotlights</h2>
          <div className="space-y-2">
            {platformSpotlights.map((spotlight) => (
              spotlight?.games?.length ? <GameCategory key={spotlight.slug ?? spotlight.title} category={spotlight} /> : null
            ))}
          </div>
        </section>
      ) : null}
      {editorPicks?.games?.length ? <GameCategory category={editorPicks} /> : null}
      {discover?.games?.length ? <GameCategory category={discover} /> : null}

    </>
  );
}
