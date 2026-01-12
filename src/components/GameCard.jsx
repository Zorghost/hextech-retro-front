import Image from "next/image";
import { getGameThumbnailUrl } from "@/lib/assetUrls";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export default function GameCard({ game, subtitle }) {
  if (!game) return null;

  return (
    <a href={`/game/${game.slug}`} className="group block">
      <div className="card overflow-hidden">
        <div className="relative w-full aspect-[16/12] overflow-hidden bg-accent-secondary">
          <Image
            src={getGameThumbnailUrl(game.image)}
            alt={game.title}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized={isProxyImageSource}
            quality={80}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/0 to-black/0 opacity-70" />
        </div>

        <div className="p-3">
          {subtitle ? <div className="text-xs text-accent mb-1">{subtitle}</div> : null}
          <div className="font-medium leading-snug line-clamp-2">{game.title}</div>
        </div>
      </div>
    </a>
  );
}
