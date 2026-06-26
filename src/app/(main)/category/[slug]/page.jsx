import { getCategoryBySlug, getGamesByCategory } from "@/features/game/queries";
import { getSiteUrl } from "@/lib/siteUrl";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import Image from "next/image";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Pagination from "@/components/ui/Pagination";
import GameCard from "@/components/ui/GameCard";
import { notFound } from "next/navigation";
import Script from "next/script";
import { buildBreadcrumbJsonLd, buildMetaDescription, safeJsonLdStringify } from "@/features/game/seo";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export async function generateMetadata({ params, searchParams }) {
  const siteUrl = getSiteUrl();
  const page = parseInt(searchParams?.page, 10) || 1;
  const category = await getCategoryBySlug(params.slug);

  const titleBase = category?.title || params.slug;
  const title = page > 1 ? `${titleBase} (Page ${page})` : titleBase;
  const countSuffix = category?.title
    ? `Browse browser-playable games from the ${category.title} collection.`
    : "Browse browser-playable games from this retro collection.";
  const description = category?.core
    ? buildMetaDescription(
        `Browse ${titleBase} retro games on Retro Hextech.`,
        [
          `Compare platform collections and launch browser-playable classics from the ${category.core} core.`,
          countSuffix,
        ]
      )
    : buildMetaDescription(
        `Browse ${titleBase} retro games on Retro Hextech.`,
        ["Compare platform collections and launch browser-playable classics from the matching category.", countSuffix]
      );

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
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function Page({ params, searchParams }) {
  const page = parseInt(searchParams?.page, 10) || 1;
  const category = await getCategoryBySlug(params.slug);

  if (!category) {
    notFound();
  }

  const { games, totalPages, totalCount, currentPage } = await getGamesByCategory(params.slug, page);
  const categorySubtitle = category.core
    ? `Core: ${category.core}. ${totalCount} games in this collection.`
    : `${totalCount} games in this collection. Browse ${category.title} retro games and jump into browser-playable classics.`;
  const collectionHighlights = games.slice(0, 3).map((game) => game.title).filter(Boolean);
  const siteUrl = getSiteUrl();
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Home", href: "/" },
    { name: "Categories", href: "/category" },
    { name: category.title, href: `/category/${params.slug}${currentPage > 1 ? `?page=${currentPage}` : ""}` },
  ], siteUrl);

  return (
    <div className="space-y-6">
      <Script
        id="category-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(breadcrumbLd) }}
      />
      <div>
        <h1 className="font-display text-3xl md:text-4xl">{category.title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">{categorySubtitle}</p>
        {collectionHighlights.length ? (
          <p className="mt-3 max-w-3xl text-sm text-slate-400 md:text-base">
            Featured titles here include {collectionHighlights.join(", ")}. Use this page to compare the collection, spot familiar names, and start playing quickly.
          </p>
        ) : null}
      </div>

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories", href: "/category" }, { label: category.title }]} />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {games.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No games in this category"
              description="Try another category, or check back later."
              action={
                <Link
                  href="/category"
                  className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
                >
                  Browse categories
                </Link>
              }
            />
          </div>
        ) : (
          games.map((game) => (
            <GameCard key={game.id} game={game} showDescription={false} />
          ))
        )}
      </div>


      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          ariaLabel="Category pagination"
          getHref={(pageNumber) => `/category/${params.slug}?page=${pageNumber}`}
        />
      )}





    </div>
  )
}