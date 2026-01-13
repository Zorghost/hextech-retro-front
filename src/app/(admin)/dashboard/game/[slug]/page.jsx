import Header from "@/components/Admin/Header"
import { getGameById, getGameCategories } from "@/lib/adminQueries";
import GameForm from "@/app/(admin)/dashboard/game/(form)/form";
import EmptyState from "@/components/ui/EmptyState";

export default async function Page({params}) {
  const gameId = params.slug;
  const [gameData, categories] = await Promise.all([
    getGameById(parseInt(gameId)),
    getGameCategories()
  ]);

  return (
    <>
      <Header />

      <div className="container mx-auto mb-8 px-4 min-h-[50rem] pb-8 relative mt-10">
      {/* {JSON.stringify(gameData, null, 2)} */}
        <a href="/dashboard" className="text-sm">&#8592; Back</a>
        <div className="flex justify-between gap-4 mb-4">
          <h1 className="font-display">Update Game</h1>
          <a href={`/game/slug-of-the-game`}
            className="text-sm border border-accent py-2 px-3 rounded-xl"
          >
            View Game &rarr;
          </a>
        </div>

        {!gameData ? (
          <EmptyState
            title="Game not found"
            description="This game may have been deleted or the ID is invalid."
            action={
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-[24px] border border-accent px-5 py-3 text-base font-medium"
              >
                Back to dashboard
              </a>
            }
          />
        ) : (
          <GameForm categories={categories} game={gameData} />
        )}

      </div>
    
    </>
  )
}