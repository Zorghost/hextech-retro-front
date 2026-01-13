import { ChevronRightIcon } from "@heroicons/react/24/outline"
import Image from "next/image"
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import Link from "next/link";

export default function GameCategory({category}) {
  if (!category) {
    return null;
  }

  const games = Array.isArray(category.games) ? category.games : [];

  return (
    <section className="mb-4">
      
      <div className="flex justify-between gap-4">
        <h2 className="font-display mb-4 items-center">{category.title}</h2>
        <Link href={`/category/${category.slug}`} className="text-sm font-medium hover:underline underline-offset-4">
          View All <ChevronRightIcon className="h-4 w-4 inline-block text-accent"/>
        </Link>
      </div>

      {games.length === 0 ? (
        <p className="text-sm text-accent">No games yet.</p>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {games.map((game) => (
          <Link href={`/game/${game.slug}`} key={game.id} className="group">
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border border-accent-secondary mb-2">
              <Image
                src={getGameThumbnailUrl(game.image)}
                alt={game.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                quality={80}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
              <p className="text-sm text-accent">{category.title}</p>
              <h1 className="font-medium">{game.title}</h1>
          </Link>
        ))}
      </div>
      )}

    </section>
  )
}