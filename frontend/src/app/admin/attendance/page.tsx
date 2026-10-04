'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAttendanceSummary, useCheckInEvents } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function AdminAttendancePage() {
  const { data: eventsData, isLoading: eventsLoading } = useCheckInEvents();
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary();
  const events = eventsData ?? [];
  const maxTotal = Math.max(1, ...(summary ?? []).map((row) => row.total));

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Attendance</h1>
        <p className="mt-2 text-sm text-ui-subtle">Check people in to an event and follow headcounts over time.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Check in</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <p className="text-sm text-ui-subtle">Loading events...</p>
          ) : events.length === 0 ? (
            <p className="text-sm text-ui-subtle">No events in the last or next two weeks.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/admin/attendance/${event.id}`}
                    className="flex items-center justify-between gap-3 py-3 hover:text-sky-700 dark:hover:text-cyan-300"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{event.name}</span>
                      <span className="text-xs text-ui-subtle">
                        {formatDateTime(event.event_date)}
                        {event.location ? ` · ${event.location}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">Open sheet →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent headcounts</CardTitle>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <p className="text-sm text-ui-subtle">Loading headcounts...</p>
          ) : !summary || summary.length === 0 ? (
            <p className="text-sm text-ui-subtle">No past events with attendance yet.</p>
          ) : (
            <ul className="space-y-3">
              {summary.map((row) => (
                <li key={row.event_id} className="space-y-1">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate font-medium">
                      {row.name} <span className="text-ui-subtle">· {formatDateTime(row.event_date)}</span>
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {row.total} ({row.members} members, {row.guests} guests)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden>
                    <div className="h-2 rounded-full bg-sky-600" style={{ width: `${(row.total / maxTotal) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
