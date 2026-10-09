import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface', className)} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-card border border-border bg-card p-5" aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export default Skeleton;
