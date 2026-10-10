'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpenText } from 'lucide-react';
import DevotionalBody from '@/components/devotionals/DevotionalBody';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import Section from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { useDevotionalArchive, useTodayDevotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function DevotionalsPage() {
  const [page, setPage] = React.useState(1);
  const { data: today, isLoading: todayLoading, isError: todayError } = useTodayDevotional();
  const { data: archive, isLoading: archiveLoading, isError: archiveError } = useDevotionalArchive(page);

  return (
    <div className="container-max space-y-12 py-10 sm:py-12">
      <PageHeader
        eyebrow="Devotional"
        title="Daily devotional"
        description="Scripture, a short reflection and a prayer for each day."
      />

      {todayLoading ? (
        <div className="max-w-3xl space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : todayError ? (
        <EmptyState icon={BookOpenText} title="Today's devotional couldn't load right now" message="Please try again in a moment." />
      ) : today ? (
        <DevotionalBody devotional={today} />
      ) : (
        <EmptyState icon={BookOpenText} title="No devotional has been published yet" message="Check back soon for today's reading." />
      )}

      <Section title="Earlier devotionals">
        {archiveLoading ? (
          <div className="space-y-2" role="status">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : archiveError ? (
          <EmptyState icon={BookOpenText} title="Earlier devotionals couldn't load right now" message="Please try again in a moment." />
        ) : (archive?.data ?? []).length === 0 ? (
          <EmptyState icon={BookOpenText} title="Nothing here yet" message="Past devotionals will be listed here." />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {(archive?.data ?? []).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/devotionals/${item.id}`}
                    className="flex min-h-11 items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface"
                  >
                    <span className="min-w-0 truncate font-medium text-foreground">{item.title}</span>
                    <span className="shrink-0 text-sm text-muted">{formatDateOnly(item.publish_date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {(page > 1 || archive?.hasMore) && (
          <div className="flex gap-3">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Newer
            </Button>
            <Button variant="secondary" disabled={!archive?.hasMore} onClick={() => setPage((p) => p + 1)}>
              Older
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
}
