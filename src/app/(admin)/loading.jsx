import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto mb-8 px-4 min-h-[50rem] pb-8 relative mt-10">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-accent rounded-md p-4">
            <Skeleton className="h-7 w-12 mb-3" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>

      <div className="flex justify-between gap-4 mb-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-10 w-40 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex gap-4 rounded-md border border-accent-secondary p-3">
            <Skeleton className="w-16 h-16 rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-3 w-24 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
