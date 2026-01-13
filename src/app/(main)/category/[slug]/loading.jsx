import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-8 w-1/3 mb-4" />
      <div className="mb-6">
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index}>
            <Skeleton className="w-full aspect-square rounded-lg border border-accent-secondary mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Skeleton className="h-10 w-72" />
      </div>
    </div>
  );
}
