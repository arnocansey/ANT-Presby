'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Search, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEvents, useUserEventRegistrations } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';

const badgeColors = [
  'bg-amber-500',
  'bg-purple-500',
  'bg-green-600',
  'bg-blue-600',
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
    <div className="container-max py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Events</h1>
        <p className="mt-2 text-ui-subtle">
          Stay connected with worship services, conferences, and community gatherings.
        </p>
      </div>

      <div className="mb-5 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
        <Input
          className="h-12 rounded-xl border-slate-200 bg-white pl-10 dark:border-slate-800 dark:bg-slate-950"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {(['all', 'upcoming', 'past'] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === value
                ? 'bg-sky-700 text-white dark:bg-cyan-400 dark:text-slate-950'
                : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <EventState text="Loading events..." />}
      {!isLoading && error && <EventState text="Failed to load events." />}
      {!isLoading && !error && filtered.length === 0 && (
        <EventState text="No events match your search right now." />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((event, index) => {
            const eventDate = new Date(event?.event_date || event?.eventDate);
            const registeredCount = Number(event?.registered_count || 0);
            const maxRegistrations = Number(event?.max_registrations || event?.maxRegistrations || 0);

            return (
              <div
                key={event.id}
                className="flex flex-col gap-5 rounded-[1.4rem] border border-slate-200 bg-white p-5 transition-colors hover:border-sky-300 sm:flex-row dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40"
              >
                <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${badgeColors[index % badgeColors.length]}`}>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="text-2xl font-black text-white">{eventDate.getDate()}</span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">{event.name}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                      {event.status || 'active'}
                    </span>
                  </div>
                  <p className="mb-3 text-sm text-ui-subtle">
                    {event.description || 'View details to learn more about this gathering.'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-ui-subtle">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {eventDate.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.location || 'Location to be announced'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {maxRegistrations > 0
                        ? `${registeredCount}/${maxRegistrations} registered`
                        : `${registeredCount} registered`}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-start gap-2">
                  <Button asChild variant="outline" className="rounded-full">
                    <Link href={`/events/${event.id}`}>Details</Link>
                  </Button>
                  {isAuthenticated && registeredIds.has(event.id) ? (
                    <Button
                      disabled
                      className="rounded-full bg-amber-500 text-slate-950 opacity-70"
                    >
                      Registered
                    </Button>
                  ) : (
                    <Button asChild className="rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400">
                      <Link href={isAuthenticated ? `/events/${event.id}` : '/login'}>
                        {isAuthenticated ? 'Register' : 'Sign In'}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EventState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-10 text-center text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      {text}
    </div>
  );
}
