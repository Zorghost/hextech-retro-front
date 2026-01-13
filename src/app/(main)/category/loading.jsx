import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-8 w-1/3 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="group">
            <Skeleton className="w-full aspect-square rounded-lg border border-accent-secondary" />
            <Skeleton className="h-4 w-2/3 mt-2" />
            <Skeleton className="h-3 w-full mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
