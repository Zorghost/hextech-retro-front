export function Skeleton({ className = "" }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-accent-secondary/60 ${className}`}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  const safeLines = Math.max(1, Math.min(10, Number(lines) || 3));

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: safeLines }).map((_, index) => (
        <Skeleton
          key={index}
          className={`h-3 ${index === safeLines - 1 ? "w-2/3" : "w-full"}`}
        />
      ))}
    </div>
  );
}
