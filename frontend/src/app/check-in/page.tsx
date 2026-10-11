'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSection } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { useLeaveOnLostAccess } from '@/components/attendance/StaffGuard';
import { useCheckInEvents } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function CheckInEventsPage() {
  const [input, setInput] = React.useState('');
  const [term, setTerm] = React.useState('');

  // Wait for a pause in typing before searching.
  React.useEffect(() => {
    const timer = setTimeout(() => setTerm(input), 300);
    return () => clearTimeout(timer);
  }, [input]);

  const searching = term.trim().length >= 2;
  const eventsQuery = useCheckInEvents(term);
  useLeaveOnLostAccess(eventsQuery.error);
  const events = eventsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Check-in" description="Choose an event to check people in and count heads." />

      <FormSection
        title={searching ? 'Search results' : 'This fortnight'}
        description={searching ? 'Any past event, including ones you missed.' : 'Events from the last and next two weeks.'}
      >
        <div className="mb-4 space-y-2 sm:max-w-sm">
          <Label htmlFor="event-search">Find an older event</Label>
          <Input
            id="event-search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Event name (at least 2 letters)"
          />
        </div>

        {eventsQuery.isLoading ? (
          <CardListSkeleton count={2} label="Loading events" />
        ) : eventsQuery.isError && !eventsQuery.data ? (
          <LoadError what="events" onRetry={() => eventsQuery.refetch()} />
        ) : events.length === 0 ? (
          <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
            {searching ? 'No events match.' : 'No events in the last or next two weeks.'}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/check-in/${event.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg py-3 text-foreground transition-colors hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{event.name}</span>
                    <span className="text-xs text-muted">
                      {formatDateTime(event.event_date)}
                      {event.location ? ` · ${event.location}` : ''}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-link">
                    Open sheet
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
