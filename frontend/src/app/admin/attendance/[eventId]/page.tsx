'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarX } from 'lucide-react';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSection } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useCheckIn, useEventAttendance, useMemberSearch, useUndoCheckIn } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

const crumbs = [ADMIN_HOME_CRUMB, { label: 'Attendance', href: '/admin/attendance' }];

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

export default function EventCheckInPage() {
  const params = useParams<{ eventId: string }>();
  const id = Number(params?.eventId);
  const eventId = Number.isInteger(id) && id > 0 ? id : undefined;

  const { data: sheet, isLoading, error, refetch } = useEventAttendance(eventId);
  const checkIn = useCheckIn(eventId);
  const undo = useUndoCheckIn();

  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');
  const { data: searchResults, isFetching: searching } = useMemberSearch(searchTerm);

  // Wait for a pause in typing before searching.
  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const checkedInIds = new Set([
    ...(sheet?.registered ?? []).filter((p) => p.checked_in).map((p) => p.user_id),
    ...(sheet?.walk_in_members ?? []).map((p) => p.user_id),
  ]);
  const busy = checkIn.isPending || undo.isPending;
  const cancelled = sheet?.event.status === 'cancelled';

  const addGuest = (event: React.FormEvent) => {
    event.preventDefault();
    const name = guestName.trim();
    if (!name) return;
    checkIn.mutate({ guestName: name }, { onSuccess: () => setGuestName('') });
  };

  // Keep showing a loaded sheet if a background refresh fails (e.g. a flaky connection mid check-in).
  const notFound = !eventId || (error as any)?.response?.status === 404;

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Check-in' }]} title="Check-in" />
        <EmptyState
          icon={CalendarX}
          title="This event could not be found."
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/attendance">Back to attendance</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (error && !sheet) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Check-in' }]} title="Check-in" />
        <LoadError what="the check-in sheet" onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !sheet) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Check-in' }]} title="Check-in" />
        <CardListSkeleton count={3} label="Loading check-in sheet" className="grid gap-6 lg:grid-cols-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[...crumbs, { label: sheet.event.name }]}
        title={sheet.event.name}
        description={`${formatDateTime(sheet.event.event_date)}${sheet.event.location ? ` · ${sheet.event.location}` : ''}`}
      />

      <div className="space-y-3">
        {cancelled && (
          <p role="status" className="text-sm font-semibold text-danger">
            This event was cancelled; check-in is closed.
          </p>
        )}
        <div className="flex flex-wrap gap-2" aria-label="Totals">
          <Badge tone="gold">{sheet.totals.total} present</Badge>
          <Badge tone="neutral">{sheet.totals.checked_in_members} members</Badge>
          <Badge tone="neutral">{sheet.totals.guests} guests</Badge>
          <Badge tone="neutral">{sheet.totals.registered} registered</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormSection title={`Registered (${sheet.registered.length})`}>
          {sheet.registered.length === 0 ? (
            <Empty>Nobody registered for this event.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {sheet.registered.map((person) => (
                <li key={person.user_id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{fullName(person)}</span>
                    <span className="block truncate text-xs text-muted">{person.email}</span>
                  </span>
                  {person.checked_in && person.record_id ? (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => undo.mutate(person.record_id as number)}>
                      Undo
                    </Button>
                  ) : (
                    <Button size="sm" disabled={busy || cancelled} onClick={() => checkIn.mutate({ userId: person.user_id })}>
                      Check in
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </FormSection>

        <div className="space-y-6">
          <FormSection title="Add someone">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="member-search">Find a member</Label>
                <Input
                  id="member-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Name or email (at least 2 letters)"
                  disabled={cancelled}
                />
                {searchTerm.trim().length >= 2 && (
                  <ul className="divide-y divide-border" aria-live="polite">
                    {searching && <li className="py-2 text-xs text-muted">Searching...</li>}
                    {!searching && (searchResults ?? []).length === 0 && (
                      <li className="py-2 text-xs text-muted">No members match.</li>
                    )}
                    {(searchResults ?? []).map((member) => {
                      const already = checkedInIds.has(member.id);
                      return (
                        <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">{fullName(member)}</span>
                            <span className="block truncate text-xs text-muted">{member.email}</span>
                          </span>
                          <Button
                            size="sm"
                            variant={already ? 'secondary' : 'primary'}
                            disabled={already || busy || cancelled}
                            onClick={() => checkIn.mutate({ userId: member.id })}
                          >
                            {already ? 'Checked in' : 'Check in'}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <form onSubmit={addGuest} className="space-y-2">
                <Label htmlFor="guest-name">Walk-in guest</Label>
                <div className="flex gap-2">
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Guest's name"
                    maxLength={255}
                    disabled={cancelled}
                  />
                  <Button type="submit" disabled={!guestName.trim() || busy || cancelled}>
                    Add
                  </Button>
                </div>
              </form>
            </div>
          </FormSection>

          <FormSection title={`Walk-ins (${sheet.walk_in_members.length + sheet.guests.length})`}>
            {sheet.walk_in_members.length + sheet.guests.length === 0 ? (
              <Empty>No walk-ins yet.</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {sheet.walk_in_members.map((person) => (
                  <li key={`m-${person.record_id}`} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-foreground">{fullName(person)}</span>
                      <Badge tone="neutral">Member</Badge>
                    </span>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => undo.mutate(person.record_id)}>
                      Undo
                    </Button>
                  </li>
                ))}
                {sheet.guests.map((guest) => (
                  <li key={`g-${guest.record_id}`} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-foreground">{guest.guest_name}</span>
                      <Badge tone="gold">Guest</Badge>
                    </span>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => undo.mutate(guest.record_id)}>
                      Undo
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </FormSection>
        </div>
      </div>
    </div>
  );
}
