import Image from "next/image";
import Link from "next/link";
import { getSearchResults } from "@/lib/gameQueries";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import EmptyState from "@/components/ui/EmptyState";

export default async function Page(req) {
  const searchQuery = req.searchParams.q;

  let games;
  if (searchQuery) {
    games = await getSearchResults(searchQuery);
  } else {
    games = [];
  }

  const safeQuery = typeof searchQuery === "string" ? searchQuery.trim() : "";

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl mb-4">
        {safeQuery ? `Search results for ${safeQuery}` : "Search"}
      </h1>

      {!safeQuery ? (
        <EmptyState
          title="Type something to search"
          description="Try a game title, platform, or keyword."
          action={
            <Link
              href="/category"
              className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
            >
              Browse categories
            </Link>
          }
        />
      ) : games.length === 0 ? (
        <>
          <div className="text-accent mb-4">0 results</div>
          <EmptyState
            title="No results"
            description={`No games matched “${safeQuery}”. Try a shorter query or different keywords.`}
            action={
              <Link
                href="/category"
                className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
              >
                Browse categories
              </Link>
            }
          />
        </>
      ) : (
        <>
          <div className="text-accent mb-4">{`${games.length} results`}</div>

          <ul>
            {games.map((game) => (
              <li key={game.id} className="mb-2">
                <Link
                  href={`/game/${game.slug}`}
                  className="flex bg-main hover:bg-accent-secondary p-4 rounded-lg gap-4"
                >
                  <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-md sm:w-28 lg:w-32">
                    <Image
                      src={getGameThumbnailUrl(game.image)}
                      alt={game.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                      quality={50}
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                    <p className="text-xl">{game.title}</p>
                    <p>{game.description}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
