import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState";
import { getLatestPublishedGames } from "@/lib/gameQueries";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import { getSiteUrl } from "@/lib/siteUrl";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export async function generateMetadata() {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/new-games`;

  return {
    title: "New games",
    description: "The latest retro games added to the library.",
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: "New games",
      description: "The latest retro games added to the library.",
    },
  };
}

export default async function Page() {
  const games = await getLatestPublishedGames(10);

  return (
    <div>
      <h1 className="font-display text-3xl mb-4">New games</h1>

      <nav className="rounded-md w-full mb-4">
        <ol className="list-reset flex">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <span className="text-gray-500 mx-2">/</span>
          </li>
          <li className="text-gray-500">New games</li>
        </ol>
      </nav>

      {games.length === 0 ? (
        <EmptyState
          title="No new games yet"
          description="Once games are published, the latest 10 will show up here."
          action={
            <a
              href="/category"
              className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
            >
              Browse categories
            </a>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {games.map((game) => (
            <a href={`/game/${game.slug}`} key={game.id} className="group">
              <div className="relative w-full aspect-square overflow-hidden rounded-lg border-accent-secondary border mb-2">
                <Image
                  src={getGameThumbnailUrl(game.image)}
                  alt={game.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                  unoptimized={isProxyImageSource}
                  quality={80}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <h2 className="font-medium">{game.title}</h2>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
