import { ChevronRightIcon } from "@heroicons/react/24/outline"
import Link from "next/link"
import GameCard from "@/components/ui/GameCard";

export default function GameCategory({category}) {
  if (!category) {
    return null;
  }

  const games = Array.isArray(category.games) ? category.games : [];
  const categoryHref = category.href ?? (category.slug ? `/category/${category.slug}` : null);

  return (
    <section className="mb-4">
      
      <div className="flex justify-between gap-4">
        <h2 className="font-display mb-4 items-center">{category.title}</h2>
        {categoryHref ? (
          <Link href={categoryHref} className="text-sm font-medium hover:underline underline-offset-4">
          View All <ChevronRightIcon className="h-4 w-4 inline-block text-accent"/>
          </Link>
        ) : null}
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-accent">No games yet.</p>
      ) : (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {games.map((game) => (
          <GameCard key={game.id} game={game} showDescription={false} className="h-full" />
        ))}
      </div>
      )}

    </section>
  )
}