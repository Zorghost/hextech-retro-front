import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto mb-8 px-4 min-h-[50rem] pb-8 relative mt-10">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-56 mb-6" />

      <div className="rounded-xl border border-accent-secondary bg-main p-6">
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index}>
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-3">
          <Skeleton className="h-11 w-32 rounded-[24px]" />
          <Skeleton className="h-11 w-32 rounded-[24px]" />
        </div>
      </div>
    </div>
  );
}
