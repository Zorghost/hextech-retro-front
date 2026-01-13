import Image from "next/image";
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
            <a
              href="/category"
              className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
            >
              Browse categories
            </a>
          }
        />
      ) : games.length === 0 ? (
        <>
          <div className="text-accent mb-4">0 results</div>
          <EmptyState
            title="No results"
            description={`No games matched “${safeQuery}”. Try a shorter query or different keywords.`}
            action={
              <a
                href="/category"
                className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
              >
                Browse categories
              </a>
            }
          />
        </>
      ) : (
        <>
          <div className="text-accent mb-4">{`${games.length} results`}</div>

          <ul>
            {games.map((game) => (
              <li key={game.id} className="mb-2">
                <a
                  href={`/game/${game.slug}`}
                  className="flex ga-4 bg-main hover:bg-accent-secondary p-4 rounded-lg gap-4"
                >
                  <Image
                    src={getGameThumbnailUrl(game.image)}
                    alt={game.title}
                    className="w-2/6 lg:w-1/6 rounded-md"
                    width={300}
                    height={300}
                    quality={50}
                    unoptimized
                  />
                  <div className="flex flex-col gap-4">
                    <h2 className="text-xl">{game.title}</h2>
                    <p>{game.description}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
