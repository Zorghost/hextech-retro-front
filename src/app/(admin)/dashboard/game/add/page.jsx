import Header from "@/components/Admin/Header"
import { getGameCategories } from "@/lib/adminQueries"
import GameForm from "@/app/(admin)/dashboard/game/(form)/form"
import EmptyState from "@/components/ui/EmptyState";

export default async function Page() {
  const categories = await getGameCategories();

  return (
    <>
      <Header />

      <div className="container mx-auto mb-8 px-4 min-h-[50rem] pb-8 relative mt-10">
        <a href="/dashboard" className="text-sm">&#8592; Back</a>
        <div className="flex justify-between gap-4 mb-4">
          <h1 className="font-display">Add New Game</h1>
        </div>

        {categories.length === 0 ? (
          <EmptyState
            title="No categories available"
            description="Create categories first so you can assign a game to them."
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
          <GameForm categories={categories} />
        )}

      </div>


    
    </>
  )
}