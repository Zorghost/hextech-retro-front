import Image from "next/image";
import Link from "next/link";
import { getGameThumbnailUrl } from "@/lib/assetUrls";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export default function GameCard({
  game,
  href,
  compact = false,
  showDescription = !compact,
  showCategoryTitle = true,
  className = "",
}) {
  if (!game) {
    return null;
  }

  const gameHref = href ?? `/game/${game.slug}`;

  return (
    <Link
      href={gameHref}
      className={`group block ${compact ? "rounded-xl border border-accent-secondary bg-main p-3 transition hover:border-accent hover:bg-primary" : ""} ${className}`}
    >
      <div
        className={compact
          ? "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-accent-secondary bg-primary"
          : "relative mb-2 aspect-square w-full overflow-hidden rounded-xl border border-accent-secondary bg-main"}
      >
        <Image
          src={getGameThumbnailUrl(game.image)}
          alt={game.title}
          fill
          sizes={compact ? "64px" : "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 180px"}
          unoptimized={isProxyImageSource}
          quality={50}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className={compact ? "min-w-0" : "space-y-1"}>
        {showCategoryTitle && game.categoryTitle ? (
          <p className="text-xs uppercase tracking-[0.2em] text-accent">{game.categoryTitle}</p>
        ) : null}
        <p className={`font-medium leading-snug text-slate-100 ${compact ? "truncate" : ""}`}>{game.title}</p>
        {showDescription && game.description ? (
          <p className="line-clamp-2 text-sm text-slate-300">{game.description}</p>
        ) : null}
      </div>
    </Link>
  );
}