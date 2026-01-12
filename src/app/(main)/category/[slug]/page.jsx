import { getCategoryBySlug, getGamesByCategory } from "@/lib/gameQueries";
import { getSiteUrl } from "@/lib/siteUrl";
import GameCard from "@/components/GameCard";
import SortSelect from "@/components/SortSelect";

export async function generateMetadata({ params, searchParams }) {
  const siteUrl = getSiteUrl();
  const page = parseInt(searchParams?.page, 10) || 1;
  const sort = (searchParams?.sort || "newest").toString();
  const category = await getCategoryBySlug(params.slug);

  const titleBase = category?.title || params.slug;
  const title = page > 1 ? `${titleBase} (Page ${page})` : titleBase;
  const description = category?.core || `Browse ${titleBase} retro games.`;

  const canonicalParams = new URLSearchParams();
  if (page > 1) canonicalParams.set("page", String(page));
  if (sort && sort !== "newest") canonicalParams.set("sort", sort);
  const canonical =
    canonicalParams.toString().length > 0
      ? `${siteUrl}/category/${params.slug}?${canonicalParams.toString()}`
      : `${siteUrl}/category/${params.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title,
      description,
    },
  };
}

export default async function Page({ params, searchParams }) {
  const page = parseInt(searchParams?.page, 10) || 1;
  const sort = (searchParams?.sort || "newest").toString();
  const category = await getCategoryBySlug(params.slug);
  const { games, totalPages, currentPage } = await getGamesByCategory(params.slug, page, sort);

  return(
    <div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
        <div>
          <h1 className='font-display text-3xl'>{category?.title ?? params.slug}</h1>
          {category?.core ? <p className="text-accent mt-1">{category.core}</p> : null}
          <nav className='rounded-md w-full mt-2'>
            <ol className='list-reset flex text-sm text-accent'>
          <li>
            <a href='/'>Home</a>
          </li>
          <li>
            <span className='text-gray-500 mx-2'>/</span>
          </li>
          <li className='text-gray-500 capitalize'>{params.slug}</li>
            </ol>
          </nav>
        </div>

        <SortSelect />
      </div>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
        {games.length === 0 ? (
          <p>No results.</p>
        ) : (
          games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))
        )}
      </div>


      {totalPages > 1 && (
        <div className='flex justify-center mt-8'>
          <nav className='inline-flex rounded-md overflow-hidden border border-accent-secondary'>
            {currentPage > 1 && (
              <a href={`/category/${params.slug}?page=${currentPage - 1}${sort && sort !== "newest" ? `&sort=${encodeURIComponent(sort)}` : ""}`}
              className='px-3 py-2 bg-main text-sm font-medium hover:bg-accent-secondary'>
                Previous
              </a>
            )}
            {[...Array(totalPages).keys()].map((pageNum) => (
              <a href={`/category/${params.slug}?page=${pageNum + 1}${sort && sort !== "newest" ? `&sort=${encodeURIComponent(sort)}` : ""}`}
              key={pageNum + 1}
              className={`px-3 py-2 border-l border-accent-secondary bg-main text-sm font-medium ${
                currentPage === pageNum + 1
                ? 'text-black bg-yellow-400'
                : 'text-inherit hover:bg-accent-secondary'
              }`}>
              {pageNum + 1}
              </a>
            ))}

            {currentPage < totalPages && (
              <a href={`/category/${params.slug}?page=${currentPage + 1}${sort && sort !== "newest" ? `&sort=${encodeURIComponent(sort)}` : ""}`}
              className='px-3 py-2 border-l border-accent-secondary bg-main text-sm font-medium hover:bg-accent-secondary'>
                Next
              </a>
            )}

          </nav>
        </div>
      )}





    </div>
  )
}