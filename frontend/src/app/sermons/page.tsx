'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, PlayCircle, Radio } from 'lucide-react';
import MediaPlaceholder from '@/components/site/MediaPlaceholder';
import SearchField from '@/components/site/SearchField';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import Section from '@/components/ui/section';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSermons, useSermonSeriesList } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function SermonsPage() {
  const { data, isLoading, error } = useSermons(1, 24);
  const [search, setSearch] = React.useState('');
  const sermons = (data?.data ?? []) as any[];
  const { data: seriesList, isLoading: seriesLoading, isError: seriesError } = useSermonSeriesList();

  const speakers = React.useMemo(() => {
    const values = Array.from(
      new Set(sermons.map((sermon) => sermon?.speaker).filter(Boolean))
    ) as string[];
    return ['All Speakers', ...values];
  }, [sermons]);

  const [selectedSpeaker, setSelectedSpeaker] = React.useState('All Speakers');

  const filtered = sermons.filter((sermon) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(sermon?.title || '').toLowerCase().includes(q) ||
      String(sermon?.speaker || '').toLowerCase().includes(q) ||
      String(sermon?.description || '').toLowerCase().includes(q);
    const matchesSpeaker =
      selectedSpeaker === 'All Speakers' || sermon?.speaker === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  });

  const latest = sermons[0];

  return (
    <div className="container-max space-y-12 py-10 sm:py-12">
      <PageHeader
        eyebrow="Watch"
        title="Sermons and services"
        description="Watch the latest message, follow a series, or search every sermon."
        actions={
          <Button asChild variant="secondary">
            <Link href="/live">
              <Radio className="h-4 w-4" aria-hidden="true" />
              Live stream
            </Link>
          </Button>
        }
      />

      {/* Latest sermon */}
      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-panel" />
      ) : !error && latest ? (
        <Link
          href={`/sermons/${latest.id}`}
          className="group grid overflow-hidden rounded-panel border border-border bg-card transition-colors hover:border-primary/40 md:grid-cols-[1.1fr_1fr]"
        >
          <MediaPlaceholder icon={PlayCircle} className="h-48 md:h-full md:min-h-[14rem]" />
          <span className="flex min-w-0 flex-col justify-center gap-3 p-6 sm:p-8">
            <Badge tone="gold" className="self-start">
              Latest sermon
            </Badge>
            <span className="break-words text-2xl font-bold tracking-tight text-foreground">{latest.title}</span>
            <span className="text-sm text-muted">
              {latest.speaker || 'ANT PRESS'}
              {latest.sermon_date ? ` · ${formatDateOnly(latest.sermon_date)}` : ''}
            </span>
            {latest.description && <span className="line-clamp-3 text-foreground/85">{latest.description}</span>}
            <span className="text-sm font-semibold text-link group-hover:underline">Watch now →</span>
          </span>
        </Link>
      ) : null}

      <Section title="Series">
        {seriesLoading ? (
          <div className="flex gap-4 overflow-hidden" role="status">
            <span className="sr-only">Loading…</span>
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-28 w-56 shrink-0 rounded-card" />
            ))}
          </div>
        ) : seriesError ? (
          <EmptyState icon={Layers} title="Series couldn't load right now" message="Please try again in a moment." />
        ) : !seriesList || seriesList.length === 0 ? (
          <EmptyState icon={Layers} title="No series yet" message="Sermon series will appear here." />
        ) : (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {seriesList.map((series) => (
              <Link
                key={series.id}
                href={`/sermons/series/${series.id}`}
                className="w-56 shrink-0 snap-start rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="line-clamp-2 block font-semibold text-foreground">{series.title}</span>
                <span className="mt-1 block text-xs text-muted">
                  {series.sermon_count} {series.sermon_count === 1 ? 'sermon' : 'sermons'}
                  {series.start_date ? ` · from ${formatDateOnly(series.start_date)}` : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="All sermons">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchField
            label="Search sermons"
            className="flex-1"
            placeholder="Search sermons, speakers and descriptions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="sm:w-56">
            <Label htmlFor="sermon-speaker" className="sr-only">
              Speaker
            </Label>
            <Select id="sermon-speaker" value={selectedSpeaker} onChange={(e) => setSelectedSpeaker(e.target.value)}>
              {speakers.map((speaker) => (
                <option key={speaker} value={speaker}>
                  {speaker}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isLoading ? (
          <SkeletonGrid count={4} className="sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4" />
        ) : error ? (
          <EmptyState icon={PlayCircle} title="Sermons couldn't load right now" message="Please try again in a moment." />
        ) : sermons.length === 0 ? (
          <EmptyState icon={PlayCircle} title="No sermons yet" message="Recorded sermons will appear here." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            title="No sermons match your search"
            message="Try a different word or speaker."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setSelectedSpeaker('All Speakers');
                }}
              >
                Clear search
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((sermon) => (
              <Link
                key={sermon.id}
                href={`/sermons/${sermon.id}`}
                className="group flex flex-col overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-primary/40"
              >
                <MediaPlaceholder icon={PlayCircle} className="h-36" />
                <span className="flex flex-1 flex-col gap-1 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
                    {sermon.series_title || 'Sermon'}
                  </span>
                  <span className="line-clamp-2 font-semibold text-foreground group-hover:underline">{sermon.title}</span>
                  <span className="text-sm text-muted">{sermon.speaker || 'ANT PRESS'}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
