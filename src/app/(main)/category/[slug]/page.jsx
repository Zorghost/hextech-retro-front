import { getCategoryBySlug, getGamesByCategory } from "@/lib/gameQueries";
import { getSiteUrl } from "@/lib/siteUrl";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

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
          <div className="col-span-full">
            <EmptyState
              title="No games in this category"
              description="Try another category, or check back later."
              action={
                <a
                  href="/category"
                  className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
                >
                  Browse categories
                </a>
              }
            />
          </div>
        ) : (
          games.map((game) => (
            <a href={`/game/${game.slug}`} key={game.id} className='group'>
              <div className='relative w-full aspect-square overflow-hidden rounded-lg border-accent-secondary border mb-2'>
                <Image
                  src={getGameThumbnailUrl(game.image)}
                  alt={game.title}
                  fill
                  sizes='(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw'
                  unoptimized={isProxyImageSource}
                  quality={80}
                  className='object-cover transition-transform duration-300 group-hover:scale-105'
                />
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