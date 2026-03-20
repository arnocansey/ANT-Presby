'use client';

import React from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import SimpleTable from '@/components/ui/table';
import { useAdminEvents, useDeleteEvent } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AdminEvent = {
  id: number;
  name: string;
  event_date: string;
  location?: string;
  status?: string;
  max_registrations?: number | null;
};

export default function AdminEventsPage() {
  const { data, isLoading } = useAdminEvents();
  const del = useDeleteEvent();
  const [query, setQuery] = React.useState('');
  const [selectedEvent, setSelectedEvent] = React.useState<AdminEvent | null>(null);
  const events = (data ?? []) as AdminEvent[];

  const filteredEvents = events.filter((event) => {
    const q = query.trim().toLowerCase();
    return !q || event.name.toLowerCase().includes(q) || String(event.location || '').toLowerCase().includes(q);
  });

  return (
    <div className="container-max space-y-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Manage Events</h1>
          <p className="mt-2 text-sm text-ui-subtle">Review, edit, and prune scheduled events quickly.</p>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or location"
          />
          <Button asChild><Link href="/admin/events/new">New Event</Link></Button>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-4 text-sm text-ui-subtle">Loading events...</CardContent></Card>
      ) : filteredEvents.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-4 text-sm text-ui-subtle">No events found.</CardContent></Card>
      ) : (
        <SimpleTable
          columns={[
            {
              key: 'name',
              header: 'Event',
              render: (event: AdminEvent) => (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{event.name}</p>
                  <p className="text-xs text-ui-subtle">{event.location || 'No location set'}</p>
                </div>
              ),
            },
            {
              key: 'event_date',
              header: 'Date',
              render: (event: AdminEvent) => new Date(event.event_date).toLocaleString(),
            },
            {
              key: 'status',
              header: 'Status',
              render: (event: AdminEvent) => (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {event.status || 'active'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (event: AdminEvent) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/events/${event.id}/edit`}>Edit</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedEvent(event)}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredEvents}
        />
      )}

      {selectedEvent && (
        <ConfirmDialog
          title="Delete event?"
          description={`This will permanently remove "${selectedEvent.name}".`}
          confirmLabel="Delete Event"
          onCancel={() => setSelectedEvent(null)}
          onConfirm={() => {
            del.mutate(selectedEvent.id, {
              onSuccess: () => setSelectedEvent(null),
            });
          }}
        />
      )}
    </div>
  );
}
