import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-xl border border-accent-secondary bg-main p-6">
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-6" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
          <Skeleton className="aspect-square" />
        </div>
      </div>
    </section>
  );
}
