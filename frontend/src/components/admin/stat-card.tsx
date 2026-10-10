import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  loading = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  loading?: boolean;
}) {
  const body = (
    <Card className={cn('flex h-full items-start gap-4 p-5', href && 'transition-colors group-hover:border-primary')}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-muted">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
        )}
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  );

  if (!href) return body;
  return (
    <Link
      href={href}
      className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {body}
    </Link>
  );
}
