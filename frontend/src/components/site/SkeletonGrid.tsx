import { SkeletonCard } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Loading placeholder for card grids.
export default function SkeletonGrid({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div role="status" className={cn('grid gap-4 md:grid-cols-3', className)}>
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
