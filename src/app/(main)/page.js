import HeroSlider from "@/components/Sliders/HeroSlider";
import CategorySlider from "@/components/Sliders/CategorySlider";
import GameCategory from "@/components/GameCategory";
import { getGameCategories, getRandomPublishedGames } from "@/lib/gameQueries";

export default async function Home() {
  const [allCategoreis, discoverSection] = await Promise.all([
    getGameCategories(6),
    getRandomPublishedGames(8)
  ]);

  return (
    <>
      <HeroSlider />
      <CategorySlider categories={allCategoreis} />
      {discoverSection ? <GameCategory category={discoverSection} /> : null}

    </>
  );
}
