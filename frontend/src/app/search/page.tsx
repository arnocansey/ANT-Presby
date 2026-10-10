'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, PlayCircle, Search, SearchX } from 'lucide-react';
import SearchField from '@/components/site/SearchField';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { useGlobalSearch } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';

const rowClass =
  'group flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40';
const chipClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = React.useState(initialQuery);
  const { data, isLoading, isError } = useGlobalSearch(initialQuery, 1, 12);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const sermons = data?.sermons || [];
  const events = data?.events || [];
  const tooShort = initialQuery.trim().length < 2;

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader title="Search" description="Find sermons and events in one place." />

      <form onSubmit={onSubmit} role="search" className="flex flex-col gap-3 sm:flex-row">
        <SearchField
          label="Search the site"
          className="flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sermons, speakers, events..."
        />
        <Button type="submit">
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      {tooShort ? (
        <EmptyState icon={Search} title="Enter at least 2 characters to search." message="Try a sermon title, a speaker or an event name." />
      ) : isLoading ? (
        <SkeletonGrid count={4} className="md:grid-cols-2" />
      ) : isError ? (
        <EmptyState icon={SearchX} title="Search couldn't run right now" message="Please try again in a moment." />
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Sermons</h2>
              <span className="text-sm text-muted">{sermons.length} results</span>
            </div>
            {sermons.length === 0 ? (
              <EmptyState icon={SearchX} title="No sermons found." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {sermons.map((sermon: any) => (
                  <Link key={sermon.id} href={`/sermons/${sermon.id}`} className={rowClass}>
                    <span className={chipClass}>
                      <PlayCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground group-hover:underline">{sermon.title}</span>
                      <span className="block truncate text-sm text-muted">{sermon.speaker}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Events</h2>
              <span className="text-sm text-muted">{events.length} results</span>
            </div>
            {events.length === 0 ? (
              <EmptyState icon={SearchX} title="No events found." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {events.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className={rowClass}>
                    <span className={chipClass}>
                      <CalendarDays className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground group-hover:underline">{event.name}</span>
                      <span className="block truncate text-sm text-muted">{event.location}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container-max py-12">
          <SkeletonGrid count={4} className="md:grid-cols-2" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
