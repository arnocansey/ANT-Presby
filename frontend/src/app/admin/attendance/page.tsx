'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { FormSection } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAttendanceSummary, useCheckInEvents } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

export default function AdminAttendancePage() {
  const eventsQuery = useCheckInEvents();
  const summaryQuery = useAttendanceSummary();
  const events = eventsQuery.data ?? [];
  const summary = summaryQuery.data;
  const maxTotal = Math.max(1, ...(summary ?? []).map((row) => row.total));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Attendance' }]}
        title="Attendance"
        description="Check people in to an event and follow headcounts over time."
      />

      <FormSection title="Check in" description="Events from the last and next two weeks.">
        {eventsQuery.isLoading ? (
          <CardListSkeleton count={2} label="Loading events" />
        ) : eventsQuery.isError && !eventsQuery.data ? (
          <LoadError what="events" onRetry={() => eventsQuery.refetch()} />
        ) : events.length === 0 ? (
          <Empty>No events in the last or next two weeks.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/admin/attendance/${event.id}`}
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

      <FormSection title="Recent headcounts">
        {summaryQuery.isLoading ? (
          <CardListSkeleton count={2} label="Loading headcounts" />
        ) : summaryQuery.isError && !summary ? (
          <LoadError what="headcounts" onRetry={() => summaryQuery.refetch()} />
        ) : !summary || summary.length === 0 ? (
          <Empty>No past events with attendance yet.</Empty>
        ) : (
          <ul className="space-y-4">
            {summary.map((row) => (
              <li key={row.event_id} className="space-y-1">
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-3">
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {row.name} <span className="text-muted">· {formatDateTime(row.event_date)}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-foreground">
                    {row.total} ({row.members} members, {row.guests} guests)
                  </span>
                </div>
                <div className="h-2 rounded-full border border-border bg-surface" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(row.total / maxTotal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
