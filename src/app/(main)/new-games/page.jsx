import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import GameCard from "@/components/ui/GameCard";
import { getLatestPublishedGames } from "@/features/game/queries";
import { getGameThumbnailUrl } from "@/lib/assetUrls";
import { getSiteUrl } from "@/lib/siteUrl";
import Link from "next/link";

const isProxyImageSource = (process.env.NEXT_PUBLIC_IMAGE_SOURCE ?? "").toLowerCase() === "proxy";

export async function generateMetadata() {
  const siteUrl = getSiteUrl();
  const canonical = `${siteUrl}/new-games`;

  return {
    title: "New games",
    description: "The latest retro games added to the library.",
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      url: canonical,
      title: "New games",
      description: "The latest retro games added to the library.",
    },
  };
}

export default async function Page() {
  const games = await getLatestPublishedGames(10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl md:text-4xl">New games</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">
          Browse the latest additions to the Retro Hextech library.
        </p>
      </div>

      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "New games" }]} />

      {games.length === 0 ? (
        <EmptyState
          title="No new games yet"
          description="Once games are published, the latest 10 will show up here."
          action={
            <Link
              href="/category"
              className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
            >
              Browse categories
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} showDescription={false} />
          ))}
        </div>
      )}
    </div>
  );
}
