import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function TableSkeleton({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <Loading label={label}>
      <div className="overflow-hidden rounded-card border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-3 w-1/4" />
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="hidden h-4 w-1/5 sm:block" />
            <Skeleton className="ml-auto h-9 w-20" />
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function CardListSkeleton({
  count = 3,
  label = 'Loading',
  className = 'grid gap-3',
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <Loading label={label}>
      <div className={className}>
        {Array.from({ length: count }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </Loading>
  );
}

export function LoadError({ what, onRetry }: { what: string; onRetry?: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        icon={AlertTriangle}
        title={`Couldn't load ${what}`}
        message="Check your connection and try again."
        action={
          onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
