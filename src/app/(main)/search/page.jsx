import Link from "next/link";
import { getSearchDiscoveryData, getSearchResults } from "@/features/game/queries";
import EmptyState from "@/components/ui/EmptyState";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { getSiteUrl } from "@/lib/siteUrl";
import Script from "next/script";
import { buildBreadcrumbJsonLd, safeJsonLdStringify } from "@/features/game/seo";
import GameCard from "@/components/ui/GameCard";

export async function generateMetadata({ searchParams }) {
  const siteUrl = getSiteUrl();
  const rawQuery = searchParams?.q;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const canonical = query ? `${siteUrl}/search?q=${encodeURIComponent(query)}` : `${siteUrl}/search`;
  const title = query ? `Search results for “${query}”` : "Search";
  const description = query
    ? `Search Retro Hextech for ${query} and browse related games, platforms, and trending picks.`
    : "Search Retro Hextech by game title or platform and discover related retro games, trending searches, and quick starts.";

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
        noimageindex: true,
      },
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

function DiscoverySection({ title, children }) {
  return (
    <section className="rounded-2xl border border-accent-secondary bg-main/60 p-5">
      <h2 className="font-display text-xl text-slate-100">{title}</h2>
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
  const siteUrl = getSiteUrl();
  const breadcrumbItems = safeQuery
    ? [
        { name: "Home", href: "/" },
        { name: "Search", href: "/search" },
        { name: `Results for “${safeQuery}”`, href: `/search?q=${encodeURIComponent(safeQuery)}` },
      ]
    : [
        { name: "Home", href: "/" },
        { name: "Search", href: "/search" },
      ];
  const breadcrumbLd = buildBreadcrumbJsonLd(breadcrumbItems, siteUrl);

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
  const hasResults = games.length > 0;

  return (
    <div className="space-y-6">
      <Script
        id="search-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbLd) }}
      />
      <Breadcrumbs
        items={safeQuery
          ? [
              { label: "Home", href: "/" },
              { label: "Search", href: "/search" },
              { label: `Results for “${safeQuery}”` },
            ]
          : [
              { label: "Home", href: "/" },
              { label: "Search" },
            ]}
      />
      <div>
        <h1 className="font-display text-2xl md:text-3xl">
          {safeQuery ? `Search results for “${safeQuery}”` : "Search"}
        </h1>
        {!safeQuery ? (
          <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
            Start with a title to jump straight into results, or use the trending searches and platform chips below to explore.
          </p>
        ) : null}
      </div>

      {!safeQuery ? (
        <>
          <EmptyState
            title="Start with a title or jump into a lane"
            description="Search works best when you begin with a game title. If you are still exploring, use the trending searches, platform chips, or quick starts below."
            action={
              <Link
                href="/category"
                className="inline-flex items-center justify-center rounded-[24px] border border-accent bg-accent-secondary px-5 py-3 text-base font-medium text-slate-50 transition hover:border-accent hover:bg-primary"
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
                  <GameCard key={game.id} game={game} showDescription={false} />
                ))}
              </div>
            </DiscoverySection>
          ) : null}
        </>
      ) : !hasResults ? (
        <>
          <div className="rounded-2xl border border-accent-secondary bg-main/60 p-4 text-sm text-slate-300">
            No games matched “{safeQuery}”. Try a shorter title, use one of the related searches below, or browse directly by platform.
          </div>
          <EmptyState
            title="No results"
            description="Search suggestions are based on recent titles and trending queries. Try a broader term or pick one of the related options below."
            action={
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="inline-flex items-center justify-center rounded-[24px] border border-accent bg-accent-secondary px-5 py-3 text-base font-medium text-slate-50 transition hover:border-accent hover:bg-primary"
                >
                  Reset search
                </Link>
                <Link
                  href="/category"
                  className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium transition hover:border-accent hover:bg-primary"
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
                  <GameCard key={game.id} game={game} compact showDescription={false} />
                ))}
              </div>
            </DiscoverySection>
          ) : null}
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-accent-secondary bg-main/60 p-4 text-sm text-slate-300">
            {`${games.length} result${games.length === 1 ? "" : "s"} found for “${safeQuery}”.`}
          </div>

          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {games.map((game) => (
              <li key={game.id}>
                <GameCard game={game} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
