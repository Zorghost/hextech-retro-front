import { Skeleton, SkeletonText } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="text-sm text-accent">
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="card p-4 md:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="h-40 w-40 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <SkeletonText lines={3} />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="card p-4">
        <Skeleton className="h-[360px] w-full rounded-lg" />
      </div>
    </div>
  );
}
