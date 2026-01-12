import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="card p-4">
        <Skeleton className="h-[220px] md:h-[360px] w-full rounded-lg" />
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-6 w-24" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <Skeleton className="aspect-[16/12] w-full" />
            <div className="p-3">
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>

      <SkeletonText lines={3} className="max-w-2xl" />
    </div>
  );
}
