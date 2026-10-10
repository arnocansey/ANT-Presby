'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';
import { useAdminEvents, useDeleteEvent } from '@/hooks/useApi';

type AdminEvent = {
  id: number;
  name: string;
  event_date: string;
  location?: string;
  status?: string;
  max_registrations?: number | null;
};

export default function AdminEventsPage() {
  const { data, isLoading, isError, refetch } = useAdminEvents();
  const del = useDeleteEvent();
  const [query, setQuery] = React.useState('');
  const [selectedEvent, setSelectedEvent] = React.useState<AdminEvent | null>(null);
  const events = (data ?? []) as AdminEvent[];

  const filteredEvents = events.filter((event) => {
    const q = query.trim().toLowerCase();
    return !q || event.name.toLowerCase().includes(q) || String(event.location || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Events' }]}
        title="Events"
        description="Review, edit and prune scheduled events."
        actions={
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New event
            </Link>
          </Button>
        }
      />

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search events"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or location"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading events" />
      ) : isError && events.length === 0 ? (
        <LoadError what="events" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No events match your search.' : 'No events yet.'}
          columns={[
            {
              key: 'name',
              header: 'Event',
              render: (event: AdminEvent) => (
                <div>
                  <p className="font-semibold text-foreground">{event.name}</p>
                  <p className="text-xs text-muted">{event.location || 'No location set'}</p>
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
                <Badge tone={statusTone(event.status || 'active')}>{statusLabel(event.status || 'active')}</Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (event: AdminEvent) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/admin/events/${event.id}/edit`} aria-label={`Edit ${event.name}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedEvent(event)} aria-label={`Delete ${event.name}`}>
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
          confirmLabel="Delete event"
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
