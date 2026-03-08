import { ChevronRightIcon } from "@heroicons/react/24/outline"
import Image from "next/image"
import Link from "next/link"
import { getGameThumbnailUrl } from "@/lib/assetUrls";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export default function GameCategory({category}) {
  if (!category) {
    return null;
  }

  const games = Array.isArray(category.games) ? category.games : [];
  const categoryHref = category.slug ? `/category/${category.slug}` : null;

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {games.map((game) => (
          <Link href={`/game/${game.slug}`} key={game.id} className="group">
            <div className="overflow-hidden rounded-lg border border-accent-secondary mb-2 bg-main">
              <Image
                src={getGameThumbnailUrl(game.image)}
                width={300}
                height={300}
                alt={game.title}
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                unoptimized={isProxyImageSource}
                quality={80}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
              {game.categoryTitle ? <p className="text-sm text-accent">{game.categoryTitle}</p> : null}
              <p className="font-medium">{game.title}</p>
          </Link>
        ))}
      </div>
      )}

    </section>
  )
}