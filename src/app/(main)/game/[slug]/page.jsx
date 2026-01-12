import { getGameBySlug } from "@/lib/gameQueries";
import GameEmulator from "@/components/GameEmulator";
import Disqus from "@/components/Disqus";
import { Suspense } from "react";
import { getGameThumbnailUrl, getRomUrlWithBase } from "@/lib/assetUrls";
import { getSiteUrl } from "@/lib/siteUrl";
import { notFound } from "next/navigation";
import Script from "next/script";
import Image from "next/image";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

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
    <div className="space-y-6">
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <nav className="rounded-md w-full">
        <ol className="list-reset flex text-sm text-accent">
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

      <header className="card p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative h-36 w-36 md:h-40 md:w-40 overflow-hidden rounded-xl bg-accent-secondary">
            {game?.image ? (
              <Image
                src={getGameThumbnailUrl(game.image)}
                alt={game.title}
                fill
                sizes="160px"
                unoptimized={isProxyImageSource}
                className="object-cover"
              />
            ) : null}
          </div>

          <div className="flex-1">
            <h1 className="font-display text-2xl md:text-3xl">{game.title}</h1>
            {primaryCategory ? (
              <div className="text-sm text-accent mt-2">
                <a className="hover:underline underline-offset-4" href={`/category/${primaryCategory.slug}`}>
                  {primaryCategory.title}
                </a>
                {primaryCategory.core ? <span className="ml-2">• Core: {primaryCategory.core}</span> : null}
              </div>
            ) : null}

            {game.description ? (
              <p className="text-accent mt-4 max-w-3xl leading-relaxed">{game.description}</p>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#game" className="btn-primary">Play now</a>
              {romUrl ? (
                <a href={romUrl} className="btn-secondary" rel="noreferrer" target="_blank">
                  Open ROM
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <GameEmulator game={game} romUrl={romUrl} />

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-accent">Loading comments…</p>}>
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
