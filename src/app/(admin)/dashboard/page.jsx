import Header from "@/components/Admin/Header"
import { getGameCategories, getGameCounts, getGamesPage } from "@/features/admin/queries"
import Image from "next/image";
import Link from "next/link";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";

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

export default async function Page({ searchParams }) {
  const q = (toSingle(searchParams?.q) ?? "").toString();
  const category = (toSingle(searchParams?.category) ?? "").toString();
  const published = (toSingle(searchParams?.published) ?? "").toString();
  const page = parseInt((toSingle(searchParams?.page) ?? "1").toString(), 10);
  const pageSize = 24;

  const [gamesPage, categories, counts] = await Promise.all([
    getGamesPage({ page, pageSize, query: q, categoryId: category, published }),
    getGameCategories(),
    getGameCounts(),
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

  return (
    <>
      <Header/>

      <div className="container mx-auto mb-8 px-4 min-h-[50rem] pb-8 relative mt-10">

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex flex-col gap-2 justify-center text-center border border-accent rounded-md p-4">
            <b className="text-xl">{counts.totalGames}</b>
            <p className="text-sm">Total Games</p>
          </div>
          <div className="flex flex-col gap-2 justify-center text-center border border-accent rounded-md p-4">
            <b className="text-xl">{counts.publishedGames}</b>
            <p className="text-sm">Published Games</p>
          </div>
          <div className="flex flex-col gap-2 justify-center text-center border border-accent rounded-md p-4">
            <b className="text-xl">{counts.unpublishedGames}</b>
            <p className="text-sm">Unpublished Games</p>
          </div>
          <div className="flex flex-col gap-2 justify-center text-center border border-accent rounded-md p-4">
            <b className="text-xl">{counts.totalCategories}</b>
            <p className="text-sm">Total Categories</p>
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
                    <p>{game.title}</p>
                  </div>

                </Link>
              ))}
            </div>
          )}

          {gamesPage.totalPages > 1 && (
            <Pagination
              currentPage={gamesPage.page}
              totalPages={gamesPage.totalPages}
              ariaLabel="Dashboard pagination"
              previousLabel="← Prev"
              nextLabel="Next →"
              showPageSummary
              getHref={(pageNumber) => buildDashboardHref({ q, category, published, page: String(pageNumber) })}
            />
          )}







        </div>

      </div>
    </>
  )
}