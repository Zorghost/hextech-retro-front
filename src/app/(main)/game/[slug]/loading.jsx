import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="mb-4">
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="mb-6">
        <Skeleton className="h-8 w-1/2" />
      </div>

      <div className="rounded-xl border border-accent-secondary bg-main p-4">
        <Skeleton className="w-full aspect-video rounded-lg" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <div className="mt-8">
        <Skeleton className="h-6 w-40 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
