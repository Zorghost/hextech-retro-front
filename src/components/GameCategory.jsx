import { ChevronRightIcon } from "@heroicons/react/24/outline"
import Image from "next/image"
import { getGameThumbnailUrl } from "@/lib/assetUrls";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

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
          <a href={`/game/${game.slug}`} key={game.id} className="group">
            <div className="overflow-hidden rounded-lg border border-accent-secondary mb-2">
              <Image 
                src={getGameThumbnailUrl(game.image)}
              width={300}
              height={300}
              alt={game.title}
              unoptimized={isProxyImageSource}
              quality={80}
              className="w-full h-full object-cover transition-transform duration-300
              group-hover:scale-105"/>
          </div>
              <p className="text-sm text-accent">{category.title}</p>
              <h1 className="font-medium">{game.title}</h1>
          </a>
        ))}
      </div>
      )}

    </section>
  )
}