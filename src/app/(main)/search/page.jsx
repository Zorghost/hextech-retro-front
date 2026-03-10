import Image from "next/image";
import Link from "next/link";
import { getSearchDiscoveryData, getSearchResults } from "@/lib/gameQueries";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import EmptyState from "@/components/ui/EmptyState";

function DiscoverySection({ title, children }) {
  return (
    <section className="rounded-2xl border border-accent-secondary bg-main/60 p-5">
      <h2 className="font-display text-xl">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SearchChipLink({ href, children }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-accent-secondary bg-primary px-3 py-1.5 text-sm transition hover:border-accent hover:bg-main"
    >
      {children}
    </Link>
  );
}

function buildSuggestedQueries(query, discoveryData) {
  const normalizedQuery = typeof query === "string" ? query.trim().toLowerCase() : "";
  const queryTokens = normalizedQuery.split(/\s+/).filter((token) => token.length >= 3);
  const candidates = [
    ...discoveryData.autocompleteGames.map((game) => game.title),
    ...discoveryData.trendingSearches,
  ];
  const suggestions = [];
  const seenSuggestions = new Set([normalizedQuery]);

  for (const candidate of candidates) {
    const normalizedCandidate = candidate.toLowerCase();

    if (!normalizedCandidate || seenSuggestions.has(normalizedCandidate)) {
      continue;
    }

    if (queryTokens.length > 0 && !queryTokens.some((token) => normalizedCandidate.includes(token))) {
      continue;
    }

    suggestions.push(candidate);
    seenSuggestions.add(normalizedCandidate);

    if (suggestions.length >= 6) {
      break;
    }
  }

  if (suggestions.length > 0) {
    return suggestions;
  }

  return discoveryData.trendingSearches
    .filter((candidate) => candidate.toLowerCase() !== normalizedQuery)
    .slice(0, 6);
}

export default async function Page(req) {
  const searchQuery = req.searchParams.q;
  const safeQuery = typeof searchQuery === "string" ? searchQuery.trim() : "";

  const [games, discoveryData] = await Promise.all([
    safeQuery ? getSearchResults(safeQuery) : Promise.resolve([]),
    getSearchDiscoveryData({
      suggestionLimit: 8,
      platformLimit: 8,
      featuredLimit: 6,
    }),
  ]);

  const suggestedQueries = buildSuggestedQueries(safeQuery, discoveryData);
  const featuredGames = discoveryData.featuredGames.slice(0, 4);
  const platformChips = discoveryData.platformChips.slice(0, 8);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl md:text-3xl mb-4">
        {safeQuery ? `Search results for “${safeQuery}”` : "Search"}
      </h1>

      {!safeQuery ? (
        <>
          <EmptyState
            title="Start with a title or jump into a lane"
            description="Search works best when you begin with a game title. If you are still exploring, use the trending searches or platform chips below."
            action={
              <Link
                href="/category"
                className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
              >
                Browse categories
              </Link>
            }
          />

          {discoveryData.trendingSearches.length ? (
            <DiscoverySection title="Trending searches">
              <div className="flex flex-wrap gap-2">
                {discoveryData.trendingSearches.map((term) => (
                  <SearchChipLink key={term} href={`/search?q=${encodeURIComponent(term)}`}>
                    {term}
                  </SearchChipLink>
                ))}
              </div>
            </DiscoverySection>
          ) : null}

          {platformChips.length ? (
            <DiscoverySection title="Browse by platform">
              <div className="flex flex-wrap gap-2">
                {platformChips.map((platform) => (
                  <SearchChipLink key={platform.id} href={`/category/${platform.slug}`}>
                    {platform.title}
                  </SearchChipLink>
                ))}
              </div>
            </DiscoverySection>
          ) : null}

          {featuredGames.length ? (
            <DiscoverySection title="Quick starts">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {featuredGames.map((game) => (
                  <Link key={game.id} href={`/game/${game.slug}`} className="group">
                    <div className="relative mb-2 aspect-square overflow-hidden rounded-xl border border-accent-secondary bg-primary">
                      <Image
                        src={getGameThumbnailUrl(game.image)}
                        alt={game.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 220px"
                        quality={50}
                        unoptimized
                      />
                    </div>
                    {game.categoryTitle ? <p className="text-sm text-accent">{game.categoryTitle}</p> : null}
                    <p className="font-medium">{game.title}</p>
                  </Link>
                ))}
              </div>
            </DiscoverySection>
          ) : null}
        </>
      ) : games.length === 0 ? (
        <>
          <div className="text-accent mb-4">0 results</div>
          <EmptyState
            title="No results"
            description={`No games matched “${safeQuery}”. Try a shorter title, use one of the related searches below, or browse directly by platform.`}
            action={
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
                >
                  Reset search
                </Link>
                <Link
                  href="/category"
                  className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
                >
                  Browse categories
                </Link>
              </div>
            }
          />

          {suggestedQueries.length ? (
            <DiscoverySection title="Try these searches instead">
              <div className="flex flex-wrap gap-2">
                {suggestedQueries.map((term) => (
                  <SearchChipLink key={term} href={`/search?q=${encodeURIComponent(term)}`}>
                    {term}
                  </SearchChipLink>
                ))}
              </div>
            </DiscoverySection>
          ) : null}

          {platformChips.length ? (
            <DiscoverySection title="Maybe you meant a platform">
              <div className="flex flex-wrap gap-2">
                {platformChips.map((platform) => (
                  <SearchChipLink key={platform.id} href={`/category/${platform.slug}`}>
                    {platform.title}
                  </SearchChipLink>
                ))}
              </div>
            </DiscoverySection>
          ) : null}

          {featuredGames.length ? (
            <DiscoverySection title="Jump into something instead">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {featuredGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/game/${game.slug}`}
                    className="flex items-center gap-3 rounded-xl border border-accent-secondary bg-main p-3 transition hover:border-accent hover:bg-primary"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-primary">
                      <Image
                        src={getGameThumbnailUrl(game.image)}
                        alt={game.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                        quality={50}
                        unoptimized
                      />
                    </div>
                    <div>
                      {game.categoryTitle ? <p className="text-xs uppercase tracking-[0.2em] text-accent">{game.categoryTitle}</p> : null}
                      <p className="font-medium">{game.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </DiscoverySection>
          ) : null}
        </>
      ) : (
        <>
          <div className="text-accent mb-4">{`${games.length} results`}</div>

          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {games.map((game) => (
              <li key={game.id}>
                <Link
                  href={`/game/${game.slug}`}
                  className="group block"
                >
                  <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-lg border border-accent-secondary bg-main">
                    <Image
                      src={getGameThumbnailUrl(game.image)}
                      alt={game.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 180px"
                      quality={50}
                      unoptimized
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium leading-snug">{game.title}</p>
                    <p className="line-clamp-2 text-sm text-white/75">{game.description}</p>
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
