"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getGameThumbnailUrl } from "@/lib/assetUrls";

const fallbackThumbnail = "/game/placeholder.jpg";

export default function GameCard({
  game,
  href,
  compact = false,
  showDescription = !compact,
  showCategoryTitle = true,
  className = "",
}) {
  const initialThumbnail = game ? getGameThumbnailUrl(game.image) : fallbackThumbnail;
  const [thumbnailSrc, setThumbnailSrc] = useState(initialThumbnail);
  const [thumbnailRetry, setThumbnailRetry] = useState(0);

  if (!game) {
    return null;
  }

  const gameHref = href ?? `/game/${game.slug}`;

  const handleThumbnailError = () => {
    if (thumbnailRetry < 2) {
      const nextRetry = thumbnailRetry + 1;
      setThumbnailRetry(nextRetry);
      setThumbnailSrc(`${getGameThumbnailUrl(game.image)}?retry=${nextRetry}&ts=${Date.now()}`);
      return;
    }

    setThumbnailSrc(fallbackThumbnail);
  };

  return (
    <Link
      href={gameHref}
      className={`group flex h-full flex-col ${compact ? "rounded-xl border border-accent-secondary bg-main p-3 transition hover:border-accent hover:bg-primary" : "rounded-xl border border-accent-secondary bg-main p-2 transition hover:border-accent hover:bg-primary/80"} ${className}`}
    >
      <div
        className={compact
          ? "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-accent-secondary bg-primary"
          : "relative mb-2 aspect-square w-full overflow-hidden rounded-lg border border-accent-secondary bg-main"}
      >
        <Image
          src={thumbnailSrc}
          alt={game.title}
          fill
          sizes={compact ? "64px" : "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 180px"}
          unoptimized
          quality={50}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={handleThumbnailError}
        />
      </div>

      <div className={compact ? "min-w-0" : "mt-auto flex min-h-[3rem] flex-col justify-start"}>
        {showCategoryTitle && game.categoryTitle ? (
          <p className="text-xs uppercase tracking-[0.2em] text-accent">{game.categoryTitle}</p>
        ) : null}
        <p className={`font-medium leading-snug text-slate-100 ${compact ? "truncate" : "line-clamp-2"}`}>{game.title}</p>
        {showDescription && game.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-slate-300">{game.description}</p>
        ) : null}
      </div>
    </Link>
  );
}