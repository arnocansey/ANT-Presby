'use client';

import Link from 'next/link';
import { Church, Mic, PlayCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Section from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinistry } from '@/hooks/useApi';

export default function MinistryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useMinistry(id);
  const ministry = data as any;

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <BackLink href="/ministries" label="Back to ministries" />

      {isLoading && (
        <div className="space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}
      {!isLoading && error && (
        <EmptyState icon={Church} title="This ministry couldn't load right now" message="Please try again in a moment." />
      )}
      {!isLoading && !error && !ministry && (
        <EmptyState
          icon={Church}
          title="Ministry not found"
          message="It may have been moved or removed."
          action={
            <Button asChild variant="secondary">
              <Link href="/ministries">All ministries</Link>
            </Button>
          }
        />
      )}

      {ministry && (
        <>
          <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
              <Church className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Ministry</p>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {ministry.name || 'Ministry'}
              </h1>
              {ministry.description && (
                <p className="max-w-3xl leading-relaxed text-foreground/85">{ministry.description}</p>
              )}
            </div>
          </header>

          <Section title="Sermons">
            {!ministry.sermons || ministry.sermons.length === 0 ? (
              <EmptyState icon={PlayCircle} title="No sermons for this ministry yet" message="Messages linked to this ministry will appear here." />
            ) : (
              <div className="grid gap-3">
                {ministry.sermons.map((sermon: any) => (
                  <Link
                    key={sermon.id}
                    href={`/sermons/${sermon.id}`}
                    className="flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <PlayCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">{sermon.title}</span>
                      {sermon.speaker && (
                        <span className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
                          <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                          {sermon.speaker}
                        </span>
                      )}
                    </span>
                    <span className="hidden shrink-0 text-sm font-semibold text-link sm:inline">Open sermon</span>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
