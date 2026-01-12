import { ChevronRightIcon } from "@heroicons/react/24/outline"
import GameCard from "@/components/GameCard";

export default function GameCategory({category}) {
  if (!category) {
    return null;
  }

  const games = Array.isArray(category.games) ? category.games : [];

  return (
    <section className="mb-4">
      
      <div className="flex justify-between gap-4">
        <h2 className="font-display mb-4 items-center">{category.title}</h2>
        <a href={`/category/${category.slug}`} className="text-sm font-medium hover:underline underline-offset-4">
        View All <ChevronRightIcon className="h-4 w-4 inline-block text-accent"/>
        </a>
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-accent">No games yet.</p>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} subtitle={category.title} />
        ))}
      </div>
      )}

    </section>
  )
}