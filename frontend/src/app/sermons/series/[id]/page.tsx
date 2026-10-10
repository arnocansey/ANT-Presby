'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Layers, PlayCircle } from 'lucide-react';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useSermonSeries } from '@/hooks/useApi';
import { formatDateOnly, resolveAssetUrl } from '@/lib/utils';

export default function SermonSeriesPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const validId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { data: series, isLoading, error } = useSermonSeries(validId);

  const dateRange = series
    ? [formatDateOnly(series.start_date), formatDateOnly(series.end_date)].filter(Boolean).join(' – ')
    : '';

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <BackLink href="/sermons" label="All sermons" />

      {!validId || error ? (
        <EmptyState
          icon={Layers}
          title="This series could not be found"
          message="It may have been removed, or it couldn't load right now."
          action={
            <Button asChild variant="secondary">
              <Link href="/sermons">Browse sermons</Link>
            </Button>
          }
        />
      ) : isLoading || !series ? (
        <div className="space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <>
          <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-center">
            {series.cover_image_url && (
              <Image
                src={resolveAssetUrl(series.cover_image_url)}
                alt={series.title}
                width={240}
                height={135}
                unoptimized
                className="h-auto w-full max-w-[240px] rounded-card object-cover"
              />
            )}
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Sermon series</p>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{series.title}</h1>
              {dateRange && <p className="text-sm text-muted">{dateRange}</p>}
              {series.description && (
                <p className="max-w-2xl whitespace-pre-line text-foreground/85">{series.description}</p>
              )}
            </div>
          </header>

          {series.sermons.length === 0 ? (
            <EmptyState icon={PlayCircle} title="No sermons in this series yet" message="New messages will appear here." />
          ) : (
            <ol className="space-y-3">
              {series.sermons.map((sermon, index) => (
                <li key={sermon.id}>
                  <Link
                    href={`/sermons/${sermon.id}`}
                    className="flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">{sermon.title}</span>
                      <span className="block text-sm text-muted">
                        {sermon.speaker} · {formatDateOnly(sermon.sermon_date)}
                      </span>
                    </span>
                    <PlayCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
