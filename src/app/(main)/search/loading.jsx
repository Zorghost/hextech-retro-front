import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="h-8 w-1/2 mb-4" />
      <Skeleton className="h-4 w-32 mb-6" />

      <ul className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index} className="flex gap-4 bg-main p-4 rounded-lg border border-accent-secondary">
            <Skeleton className="w-2/6 lg:w-1/6 aspect-square rounded-md" />
            <div className="flex-1">
              <Skeleton className="h-5 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
