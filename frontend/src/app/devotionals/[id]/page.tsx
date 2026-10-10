'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpenText } from 'lucide-react';
import DevotionalBody from '@/components/devotionals/DevotionalBody';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDevotional } from '@/hooks/useApi';

export default function DevotionalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const devotionalId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { data, isLoading, error } = useDevotional(devotionalId);

  return (
    <div className="container-max space-y-6 py-10 sm:py-12">
      <BackLink href="/devotionals" label="All devotionals" />
      {!devotionalId || error ? (
        <EmptyState
          icon={BookOpenText}
          title="This devotional could not be found"
          message="It may have been removed, or it couldn't load right now."
          action={
            <Button asChild variant="secondary">
              <Link href="/devotionals">Today&apos;s devotional</Link>
            </Button>
          }
        />
      ) : isLoading || !data ? (
        <div className="max-w-3xl space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <DevotionalBody devotional={data} headingLevel="h1" />
      )}
    </div>
  );
}
