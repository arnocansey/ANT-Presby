'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarCheck, CalendarDays, MapPin, Users } from 'lucide-react';
import DateBadge from '@/components/site/DateBadge';
import SearchField from '@/components/site/SearchField';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import Tabs from '@/components/ui/tabs';
import { useEvents, useUserEventRegistrations } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { resolveAssetUrl } from '@/lib/utils';

type EventFilter = 'all' | 'upcoming' | 'past';

const FILTERS: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export default function EventsPage() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useEvents(1, 24);
  const registrationsQuery = useUserEventRegistrations(isAuthenticated);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'upcoming' | 'past'>('all');
  const events = (data?.data ?? []) as any[];
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));

  const filtered = events.filter((event) => {
    const q = search.trim().toLowerCase();
    const eventDate = new Date(event?.event_date || event?.eventDate);
    const now = new Date();
    const matchesSearch =
      !q ||
      String(event?.name || '').toLowerCase().includes(q) ||
      String(event?.location || '').toLowerCase().includes(q) ||
      String(event?.description || '').toLowerCase().includes(q);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'upcoming' && eventDate >= now) ||
      (filter === 'past' && eventDate < now);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        title="Events"
        description="Stay connected with worship services, conferences and community gatherings."
      />

      <div className="space-y-4">
        <SearchField label="Search events" placeholder="Search events" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <SkeletonGrid count={3} className="md:grid-cols-1" />
      ) : error ? (
        <EmptyState icon={CalendarDays} title="Events couldn't load right now" message="Please try again in a moment." />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events yet" message="New gatherings will appear here." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events match your search"
          message="Try another word, or switch to All."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((event) => {
            const eventDate = new Date(event?.event_date || event?.eventDate);
            const registeredCount = Number(event?.registered_count || 0);
            const maxRegistrations = Number(event?.max_registrations || event?.maxRegistrations || 0);

            return (
              <Card
                key={event.id}
                className="flex flex-col gap-4 p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-start"
              >
                <div className="flex shrink-0 items-start gap-3">
                  <DateBadge date={eventDate} />
                  {event.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveAssetUrl(event.image_url)}
                      alt=""
                      className="h-14 w-20 shrink-0 rounded-lg object-cover sm:w-24"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="min-w-0 break-words text-lg font-semibold text-foreground">{event.name}</h2>
                    <Badge tone="neutral" className="capitalize">
                      {event.status || 'active'}
                    </Badge>
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-foreground/85">
                    {event.description || 'View details to learn more about this gathering.'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {eventDate.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {event.location || 'Location to be announced'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {maxRegistrations > 0
                        ? `${registeredCount}/${maxRegistrations} registered`
                        : `${registeredCount} registered`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  <Button asChild variant="secondary">
                    <Link href={`/events/${event.id}`}>Details</Link>
                  </Button>
                  {isAuthenticated && registeredIds.has(event.id) ? (
                    <Button disabled variant="secondary">
                      <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                      Registered
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href={isAuthenticated ? `/events/${event.id}` : '/login'}>
                        {isAuthenticated ? 'Register' : 'Sign In'}
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
