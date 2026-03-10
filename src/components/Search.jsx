'use client'
import Image from "next/image"
import Link from "next/link"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { getGameThumbnailUrl } from "@/lib/assetUrls"

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

function getLiveSearchImageUrl(filename) {
  return filename ? getGameThumbnailUrl(filename) : "/icons/default.svg";
}

function SearchChip({ children, href, onClick }) {
  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        className="inline-flex items-center rounded-full border border-accent-secondary bg-primary px-3 py-1.5 text-sm text-white transition hover:border-accent hover:bg-main"
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-full border border-accent-secondary bg-primary px-3 py-1.5 text-sm text-white transition hover:border-accent hover:bg-main"
    >
      {children}
    </button>
  );
}

export default function Search({
  autocompleteGames = [],
  trendingSearches = [],
  platformChips = [],
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentQuery = searchParams.get("q") ?? "";
  const [searchTerm, setSearchTerm] = useState(currentQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [liveResults, setLiveResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const router = useRouter();
  const containerRef = useRef(null);
  const searchInputId = "site-search";
  const listboxId = `${searchInputId}-listbox`;

  useEffect(() => {
    setSearchTerm(currentQuery);
  }, [currentQuery]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  const trimmedSearchTerm = typeof searchTerm === "string" ? searchTerm.trim() : "";
  const normalizedSearchTerm = trimmedSearchTerm.toLowerCase();

  const gameSuggestions = useMemo(() => {
    if (!normalizedSearchTerm) {
      return [];
    }

    return autocompleteGames
      .filter((game) => game.title.toLowerCase().includes(normalizedSearchTerm))
      .slice(0, 6);
  }, [autocompleteGames, normalizedSearchTerm]);

  useEffect(() => {
    if (!trimmedSearchTerm) {
      setLiveResults([]);
      setIsLoading(false);
      setHasFetched(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedSearchTerm)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Live search failed with status ${response.status}`);
        }

        const payload = await response.json();
        setLiveResults(Array.isArray(payload?.results) ? payload.results : []);
        setHasFetched(true);
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error("Live search request failed", error);
        setLiveResults([]);
        setHasFetched(true);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [trimmedSearchTerm]);

  const displayedResults = trimmedSearchTerm ? liveResults : [];
  const fallbackSuggestions = trimmedSearchTerm && !displayedResults.length && !isLoading ? gameSuggestions : [];

  const platformMatches = useMemo(() => {
    if (!normalizedSearchTerm) {
      return platformChips.slice(0, 6);
    }

    return platformChips
      .filter((platform) => platform.title.toLowerCase().includes(normalizedSearchTerm))
      .slice(0, 4);
  }, [normalizedSearchTerm, platformChips]);

  const visibleTrendingSearches = trendingSearches.slice(0, 6);
  const showEmptyMessage = Boolean(trimmedSearchTerm) && hasFetched && displayedResults.length === 0 && fallbackSuggestions.length === 0;
  const shouldShowDropdown = isOpen && (
    Boolean(trimmedSearchTerm)
    || visibleTrendingSearches.length > 0
    || platformMatches.length > 0
  );

  const handleChange = (event) => {
    setSearchTerm(event.target.value);
    setActiveIndex(-1);
    setIsOpen(true);
  }

  const commitSearch = (nextTerm) => {
    const trimmed = typeof nextTerm === "string" ? nextTerm.trim() : "";

    if (!trimmed) {
      router.push("/search");
    } else {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }

    setIsOpen(false);
    setActiveIndex(-1);
  }

  const handleSearch = (event) => {
    event.preventDefault();
    commitSearch(searchTerm);
  }

  const handleSuggestionSelect = (slug) => {
    router.push(`/game/${slug}`);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    const items = displayedResults.length ? displayedResults : fallbackSuggestions;

    if (!items.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((currentIndex) => Math.min(currentIndex + 1, items.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      handleSuggestionSelect(items[activeIndex].slug);
    }
  }

  const handleClear = () => {
    setSearchTerm("");
    setActiveIndex(-1);
    setIsOpen(true);

    if (pathname === "/search" && currentQuery) {
      router.push("/search");
    }
  }

  return ( 
    <div ref={containerRef} className="relative w-full md:mx-auto md:max-w-2xl md:flex-1">
      <form onSubmit={handleSearch} className="relative" role="search">
        <label htmlFor={searchInputId} className="sr-only">
          Search for games
        </label>
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" aria-hidden="true"/>
        <input
          id={searchInputId}
          type="search"
          value={searchTerm}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search games or platforms"
          className="h-10 w-full rounded-xl border border-accent-secondary bg-main/90 pl-10 pr-24 text-sm text-white outline-none transition focus:border-accent md:pr-28"
          role="combobox"
          aria-expanded={shouldShowDropdown}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${searchInputId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 top-1/2 -translate-y-1/2 rounded-full p-1 text-white/60 transition hover:bg-primary hover:text-white md:right-16"
            aria-label="Clear search"
          >
            <XMarkIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-accent px-2.5 py-1.5 text-[11px] font-semibold text-black transition hover:opacity-90 md:px-3 md:text-xs"
        >
          Search
        </button>
      </form>

      {shouldShowDropdown ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70dvh,32rem)] overflow-y-auto rounded-2xl border border-accent-secondary bg-primary/95 shadow-2xl backdrop-blur">
          {trimmedSearchTerm ? (
            <button
              type="button"
              onClick={() => commitSearch(searchTerm)}
              className="flex w-full items-center justify-between gap-3 border-b border-accent-secondary px-4 py-3 text-left transition hover:bg-main"
            >
              <span className="min-w-0 flex-1 text-sm font-medium text-white md:text-base">Search all results for “{trimmedSearchTerm}”</span>
              <span className="hidden text-xs uppercase tracking-[0.2em] text-accent md:inline">Enter</span>
            </button>
          ) : null}

          {trimmedSearchTerm ? (
            <div className="border-b border-accent-secondary px-2 py-2">
              <div className="flex items-center justify-between px-2 pb-2">
                <p className="text-xs uppercase tracking-[0.2em] text-accent">
                  {displayedResults.length ? "Live results" : "Autocomplete"}
                </p>
                {isLoading ? <p className="text-xs text-white/60">Searching...</p> : null}
              </div>

              {displayedResults.length ? (
                <div id={listboxId} role="listbox" aria-label="Live search results" className="space-y-1">
                  {displayedResults.map((game, index) => (
                    <button
                      key={game.id}
                      id={`${searchInputId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSuggestionSelect(game.slug)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${activeIndex === index ? "bg-main" : "hover:bg-main"}`}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-accent-secondary bg-main">
                        <Image
                          src={getLiveSearchImageUrl(game.image)}
                          alt={game.title}
                          fill
                          sizes="56px"
                          unoptimized={isProxyImageSource}
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        {game.categoryTitle ? <p className="text-xs uppercase tracking-[0.2em] text-accent">{game.categoryTitle}</p> : null}
                        <p className="truncate font-medium text-white">{game.title}</p>
                        {game.description ? <p className="truncate text-sm text-white/70">{game.description}</p> : null}
                      </div>
                      <span className="hidden text-xs text-accent md:inline">Open game</span>
                    </button>
                  ))}
                </div>
              ) : fallbackSuggestions.length ? (
                <div id={listboxId} role="listbox" aria-label="Suggested games" className="space-y-1">
                  {fallbackSuggestions.map((game, index) => (
                    <button
                      key={game.id}
                      id={`${searchInputId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={activeIndex === index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => handleSuggestionSelect(game.slug)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition ${activeIndex === index ? "bg-main" : "hover:bg-main"}`}
                    >
                      <span className="min-w-0 flex-1 truncate font-medium text-white">{game.title}</span>
                      <span className="hidden text-xs text-accent md:inline">Open game</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {showEmptyMessage ? (
            <div className="border-b border-accent-secondary px-4 py-3 text-sm text-white/70">
              No close title matches yet. Search the full catalog or jump into a platform below.
            </div>
          ) : null}

          {!trimmedSearchTerm && visibleTrendingSearches.length ? (
            <div className="border-b border-accent-secondary px-4 py-3">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">Trending searches</p>
              <div className="flex flex-wrap gap-2">
                {visibleTrendingSearches.map((term) => (
                  <SearchChip key={term} onClick={() => commitSearch(term)}>
                    {term}
                  </SearchChip>
                ))}
              </div>
            </div>
          ) : null}

          {platformMatches.length ? (
            <div className="px-4 py-3">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-accent">Platform chips</p>
              <div className="flex flex-wrap gap-2">
                {platformMatches.map((platform) => (
                  <SearchChip
                    key={platform.id}
                    href={`/category/${platform.slug}`}
                    onClick={() => {
                      setIsOpen(false);
                      setActiveIndex(-1);
                    }}
                  >
                    {platform.title}
                  </SearchChip>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}