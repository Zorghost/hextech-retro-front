import { getGameBySlug } from "@/lib/gameQueries";
import GameEmulator from "@/components/GameEmulator";
import Disqus from "@/components/Disqus";
import { Suspense } from "react";
import { getGameThumbnailUrl, getRomUrlWithBase } from "@/lib/assetUrls";
import { getSiteUrl } from "@/lib/siteUrl";
import { notFound } from "next/navigation";
import Script from "next/script";

export async function generateMetadata({ params }) {
  const game = await getGameBySlug(params.slug);
  const siteUrl = getSiteUrl();

  if (!game) {
    return {
      title: "Game not found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = game.title
    ? `${game.title} | The Next Game Platform`
    : "The Next Game Platform Retro Game";
  const description = game.description || "Discover the best free Retro Games";

  const canonical = `${siteUrl}/game/${game.slug}`;
  const rawImageUrl = game.image ? getGameThumbnailUrl(game.image) : undefined;
  const imageUrl = rawImageUrl
    ? rawImageUrl.startsWith("http")
      ? rawImageUrl
      : `${siteUrl}${rawImageUrl}`
    : undefined;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      url: canonical,
      title,
      description,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function Page({ params }) {
  const game = await getGameBySlug(params.slug);

  if (!game) notFound();

  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/game/${game.slug}`;
  const primaryCategory = game?.categories?.[0];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      ...(primaryCategory
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: primaryCategory.title,
              item: `${siteUrl}/category/${primaryCategory.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: primaryCategory ? 3 : 2,
        name: game.title,
        item: canonical,
      },
    ],
  };

  const romBaseUrl = process.env.NEXT_PUBLIC_ROM_BASE_URL;
  const romUrl = game?.game_url ? getRomUrlWithBase(game.game_url, romBaseUrl) : null;

  return (
    <div>
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <nav className="rounded-md w-full mb-4">
        <ol className="list-reset flex">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <span className="text-gray-500 mx-2">/</span>
          </li>
          <li>
            {primaryCategory ? (
              <a href={`/category/${primaryCategory.slug}`}>{primaryCategory.title}</a>
            ) : (
              <span className="text-gray-500">Category</span>
            )}
          </li>
          <li>
            <span className="text-gray-500 mx-2">/</span>
          </li>
          <li>
            <span className="text-gray-500">{game?.title}</span>
          </li>
        </ol>
      </nav>

      <GameEmulator game={game} romUrl={romUrl} />

      <div className="mt-8">
        <Suspense fallback={<p>Loading game...</p>}>
          <Disqus
            url={`${process.env.NEXT_WEBSITE_URL}/game/${game?.slug}`}
            identifier={game?.id}
            title={game?.title}
          />
        </Suspense>
      </div>
    </div>
  );
}
