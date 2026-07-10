// Shared loading-placeholder primitives. Use `Skeleton` for a single pulsing
// bar/block, or `PropertyCardSkeleton` / `SkeletonRows` for common shapes so
// every list/grid in the app loads with the same look.

export function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`bg-surface-container-high rounded animate-pulse ${className}`} />;
}

export function PropertyCardSkeleton({ variant = 'grid' }) {
  const isList = variant === 'list';
  return (
    <div className={`card overflow-hidden ${isList ? 'flex' : ''}`}>
      <Skeleton className={isList ? 'w-44 h-full min-h-[7rem] rounded-none' : 'h-52 w-full rounded-none'} />
      <div className="p-4 flex-1 space-y-2">
        <Skeleton className="h-3 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonRows({ count = 3, className = 'h-12' }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${className} w-full`} />
      ))}
    </div>
  );
}

export default Skeleton;
