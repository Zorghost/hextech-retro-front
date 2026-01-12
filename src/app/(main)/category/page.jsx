import { getGameCategories } from "@/lib/gameQueries"
import Image from "next/image";
import { getCategoryImageUrl } from "@/lib/assetUrls";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export default async function Page() {
  const categories = await getGameCategories();

  return(
    <div>
      <h1 className="font-display text-3xl mb-4">Categories</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
      {categories.map((game) => (
        <a href={`/category/${game.slug}`} key={game.id} className="group">
          <div className="card overflow-hidden">
            <div className="relative w-full aspect-square bg-accent-secondary">
              <Image
                src={getCategoryImageUrl(game.image)}
                alt={game.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 20vw, 16vw"
                unoptimized={isProxyImageSource}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-3">
              <div className="font-medium">{game.title}</div>
              {game.core ? <div className="text-xs text-accent mt-1">{game.core}</div> : null}
            </div>
          </div>
        </a>
      ))}

      </div>
    </div>
  )
}