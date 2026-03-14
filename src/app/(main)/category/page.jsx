import { getGameCategories } from "@/features/game/queries"
import EmptyState from "@/components/ui/EmptyState";
import Image from "next/image";
import Link from "next/link";
import { getCategoryImageUrl } from "@/lib/assetUrls";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export default async function Page() {
  const categories = await getGameCategories();

  return(
    <div>
      <h1 className="font-display text-3xl mb-4">Categories</h1>
      {categories.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="Once categories exist, they’ll show up here."
          action={
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
            >
              Go home
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
        {categories.map((game) => (
          <Link href={`/category/${game.slug}`} key={game.id} className="group">
            <div className="relative w-full aspect-square overflow-hidden rounded-lg border-accent-secondary border">
              <Image
                src={getCategoryImageUrl(game.image)}
                alt={game.title}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 180px"
                unoptimized={isProxyImageSource}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p>{game.title}</p>
            <p>{game.description}</p>
          </Link>
        ))}

        </div>
      )}
    </div>
  )
}