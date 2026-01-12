export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-accent-secondary/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 2, className = "" }) {
  const count = Math.max(1, Math.min(lines, 6));
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse h-3 rounded bg-accent-secondary/70 ${
            i === count - 1 ? "w-2/3" : "w-full"
          }`}
        />
      ))}
    </div>
  );
}
