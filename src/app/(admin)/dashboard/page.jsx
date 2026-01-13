import Header from "@/components/Admin/Header"
import { getGameCategories, getGamesPage, getTotalGamesCount } from "@/lib/adminQueries"
import Image from "next/image";
import Link from "next/link";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import EmptyState from "@/components/ui/EmptyState";

export const revalidate = 0;

function toSingle(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildDashboardHref({ q, category, published, page }) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (published) params.set("published", published);
  if (page && page !== "1") params.set("page", page);

  const query = params.toString();
  return query.length ? `/dashboard?${query}` : "/dashboard";
}

function buildPageItems(currentPage, totalPages) {
  const safeCurrent = Math.min(Math.max(currentPage, 1), totalPages);

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({ type: "page", page: index + 1 }));
  }

  const items = [];
  const pushPage = (page) => items.push({ type: "page", page });
  const pushEllipsis = (key) => items.push({ type: "ellipsis", key });

  pushPage(1);

  const windowStart = Math.max(2, safeCurrent - 1);
  const windowEnd = Math.min(totalPages - 1, safeCurrent + 1);

  if (windowStart > 2) pushEllipsis("left");
  for (let page = windowStart; page <= windowEnd; page++) pushPage(page);
  if (windowEnd < totalPages - 1) pushEllipsis("right");

  pushPage(totalPages);
  return items;
}

export default async function Page({ searchParams }) {
  const q = (toSingle(searchParams?.q) ?? "").toString();
  const category = (toSingle(searchParams?.category) ?? "").toString();
  const published = (toSingle(searchParams?.published) ?? "").toString();
  const page = parseInt((toSingle(searchParams?.page) ?? "1").toString(), 10);
  const pageSize = 24;

  const [gamesPage, categories, totalGamesCount] = await Promise.all([
    getGamesPage({ page, pageSize, query: q, categoryId: category, published }),
    getGameCategories(),
    getTotalGamesCount(),
  ]);

  const startIndex = gamesPage.total === 0 ? 0 : (gamesPage.page - 1) * gamesPage.pageSize + 1;
  const endIndex = Math.min(gamesPage.total, gamesPage.page * gamesPage.pageSize);

  const prevHref =
    gamesPage.page > 1
      ? buildDashboardHref({ q, category, published, page: String(gamesPage.page - 1) })
      : null;
  const nextHref =
    gamesPage.page < gamesPage.totalPages
      ? buildDashboardHref({ q, category, published, page: String(gamesPage.page + 1) })
      : null;

  const pageItems = buildPageItems(gamesPage.page, gamesPage.totalPages);

  return (
    <>
      <Header/>

      <div className="container mx-auto mb-8 px-4 min-h-[50rem] pb-8 relative mt-10">

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex flex-col gap-2 justify-center text-center border border-accent rounded-md p-4">
            <b className="text-xl">{totalGamesCount}</b>
            <p className="text-sm">Total Games</p>
          </div>
          <div className="flex flex-col gap-2 justify-center text-center border border-accent rounded-md p-4">
            <b className="text-xl">{categories.length}</b>
            <p className="text-sm">Total Categories</p>
          </div>
          <div className="flex flex-col gap-2 justify-center text-center border border-accent rounded-md p-4">
            <b className="text-xl">#</b>
            <p className="text-sm">More Stats</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between gap-4 mb-4">
            <h1 className="font-display">Games</h1>
            <Link href="/dashboard/game/add" className="text-sm border border-accent py-2 px-3 rounded-xl">
              + Add New Game
            </Link>
          </div>

          <form method="GET" action="/dashboard" className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              type="text"
              name="q"
              placeholder="Search title or slug..."
              defaultValue={q}
              className="bg-black border border-accent sm:text-sm rounded-lg block w-full p-2"
            />

            <select
              name="category"
              defaultValue={category}
              className="bg-black border border-accent sm:text-sm rounded-lg block w-full p-2"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.title}
                </option>
              ))}
            </select>

            <select
              name="published"
              defaultValue={published}
              className="bg-black border border-accent sm:text-sm rounded-lg block w-full p-2"
            >
              <option value="">All visibility</option>
              <option value="true">Published</option>
              <option value="false">Private</option>
            </select>

            <button
              type="submit"
              className="text-sm border border-accent py-2 px-3 rounded-xl"
            >
              Apply
            </button>
          </form>

          <div className="flex items-center justify-between mb-3 text-sm text-accent">
            <span>
              {gamesPage.total === 0
                ? "No results"
                : `Showing ${startIndex}-${endIndex} of ${gamesPage.total}`}
            </span>
            {(q || category || published) && (
              <Link href="/dashboard" className="underline">
                Clear filters
              </Link>
            )}
          </div>

          {gamesPage.total === 0 ? (
            <EmptyState
              title="No games yet"
              description={q || category || published ? "No games match your filters." : "Create your first game to populate the library."}
              action={
                <Link
                  href="/dashboard/game/add"
                  className="inline-flex items-center justify-center rounded-[24px] bg-accent px-5 py-3 text-base font-medium text-center"
                >
                  Add New Game
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {gamesPage.games.map((game) => (
                <Link
                  href={`/dashboard/game/${game.id}`}
                  key={game.id}
                  className="flex gap-4 hover:bg-accent-secondary rounded-md"
                >
                  <div className="w-16 h-16 bg-slate-100 overflow-hidden rounded-md">
                    <Image
                      src={getGameThumbnailUrl(game.image)}
                      className="object-cover w-full h-full"
                      alt={game.title}
                      width={128}
                      height={128}
                      quality={90}
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-col gap-1 justify-center">
                    <span className="text-sm text-accent">ID: {game.id}</span>
                    <h1>{game.title}</h1>
                  </div>

                </Link>
              ))}
            </div>
          )}

          {gamesPage.totalPages > 1 && (
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-accent">
                Page {gamesPage.page} of {gamesPage.totalPages}
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                {prevHref ? (
                  <Link href={prevHref} className="text-sm border border-accent py-2 px-3 rounded-xl">
                    ← Prev
                  </Link>
                ) : (
                  <span className="text-sm border border-accent py-2 px-3 rounded-xl opacity-50 cursor-not-allowed">
                    ← Prev
                  </span>
                )}

                <div className="flex items-center gap-2">
                  {pageItems.map((item) => {
                    if (item.type === "ellipsis") {
                      return (
                        <span key={item.key} className="text-sm text-accent px-2">
                          …
                        </span>
                      );
                    }

                    const isActive = item.page === gamesPage.page;
                    const href = buildDashboardHref({ q, category, published, page: String(item.page) });

                    return isActive ? (
                      <span
                        key={item.page}
                        className="text-sm border border-accent bg-accent-secondary py-2 px-3 rounded-xl"
                        aria-current="page"
                      >
                        {item.page}
                      </span>
                    ) : (
                      <Link
                        key={item.page}
                        href={href}
                        className="text-sm border border-accent py-2 px-3 rounded-xl"
                      >
                        {item.page}
                      </Link>
                    );
                  })}
                </div>

                {nextHref ? (
                  <Link href={nextHref} className="text-sm border border-accent py-2 px-3 rounded-xl">
                    Next →
                  </Link>
                ) : (
                  <span className="text-sm border border-accent py-2 px-3 rounded-xl opacity-50 cursor-not-allowed">
                    Next →
                  </span>
                )}
              </div>
            </div>
          )}







        </div>

      </div>
    </>
  )
}