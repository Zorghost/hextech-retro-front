import { getCategoryBySlug, getGamesByCategory } from "@/lib/gameQueries";
import { getSiteUrl } from "@/lib/siteUrl";
import { getGameThumbnailUrl } from "@/lib/assetUrls";

export async function generateMetadata({ params, searchParams }) {
  const siteUrl = getSiteUrl();
  const page = parseInt(searchParams?.page, 10) || 1;
  const category = await getCategoryBySlug(params.slug);

  const titleBase = category?.title || params.slug;
  const title = page > 1 ? `${titleBase} (Page ${page})` : titleBase;
  const description = category?.core || `Browse ${titleBase} retro games.`;

  const canonical =
    page > 1
      ? `${siteUrl}/category/${params.slug}?page=${page}`
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
  const { games, totalPages, currentPage } = await getGamesByCategory(params.slug, page);

  return(
    <div>
      <h1 className='font-display text-3xl mb-4 capitalize'>{params.slug}</h1>
      <nav className='rounded-md w-full mb-4'>
        <ol className='list-reset flex'>
          <li>
            <a href='/'>Home</a>
          </li>
          <li>
            <span className='text-gray-500 mx-2'>/</span>
          </li>
          <li className='text-gray-500 capitalize'>{params.slug}</li>
        </ol>
      </nav>

      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
        {games.length === 0 ? (
          <p>No results.</p>
        ) : (
          games.map((game) => (
            <a href={`/game/${game.slug}`} key={game.id} className='group'>
              <div className='overflow-hidden rounded-lg border-accent-secondary border mb-2'>
                <img 
                  src={getGameThumbnailUrl(game.image)}
                  width={300}
                  height={300}
                  alt={game.title}
                  className='w-full h-full object-cover transition-transform duration-300 group-hover:scale-105' />
              </div>
              <h1 className='font-medium'>{game.title}</h1>
            </a>
          ))
        )}
      </div>


      {totalPages > 1 && (
        <div className='flex justify-center mt-8'>
          <nav className='inline-flex rounded-md shadow'>
            {currentPage > 1 && (
              <a href={`/category/${params.slug}?page=${currentPage - 1}`}
              className='px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50'>
                Previous
              </a>
            )}
            {[...Array(totalPages).keys()].map((pageNum) => (
              <a href={`/category/${params.slug}?page=${pageNum + 1}`}
              key={pageNum + 1}
              className={`px-3 py-2 border border-gray-300 bg-white text-sm font-medium ${
                currentPage === pageNum + 1
                ? 'text-indigo-600 bg-indigo-50'
                : 'text-gray-500 hover:bg-gray-50'
              }`}>
              {pageNum + 1}
              </a>
            ))}

            {currentPage < totalPages && (
              <a href={`/category/${params.slug}?page=${currentPage + 1}`}
              className='px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium 
              text-gray-500 hover:bg-gray-50'>
                Next
              </a>
            )}

          </nav>
        </div>
      )}





    </div>
  )
}