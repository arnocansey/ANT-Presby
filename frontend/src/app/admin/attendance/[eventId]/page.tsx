'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCheckIn, useEventAttendance, useMemberSearch, useUndoCheckIn } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

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
      <div className="container-max py-12">
        <p className="text-ui-subtle">This event could not be found.</p>
        <Link href="/admin/attendance" className="text-sm font-semibold text-sky-700">
          ← Back to attendance
        </Link>
      </div>
    );
  }

  if (error && !sheet) {
    return (
      <div className="container-max space-y-3 py-12">
        <p className="text-ui-subtle">Could not load the check-in sheet. Check your connection and try again.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (isLoading || !sheet) {
    return <div className="container-max py-12 text-sm text-ui-subtle">Loading check-in sheet...</div>;
  }

  return (
    <div className="container-max space-y-6 py-12">
      <div className="space-y-2">
        <Link href="/admin/attendance" className="text-sm font-semibold text-sky-700 dark:text-cyan-300">
          ← Back to attendance
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{sheet.event.name}</h1>
        <p className="text-sm text-ui-subtle">
          {formatDateTime(sheet.event.event_date)}
          {sheet.event.location ? ` · ${sheet.event.location}` : ''}
        </p>
        {cancelled && <p className="text-sm font-semibold text-red-700">This event was cancelled; check-in is closed.</p>}
        <div className="flex flex-wrap gap-3 pt-2 text-sm">
          <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-900 dark:bg-sky-900/40 dark:text-sky-100">
            {sheet.totals.total} present
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            {sheet.totals.checked_in_members} members
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">{sheet.totals.guests} guests</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">
            {sheet.totals.registered} registered
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registered ({sheet.registered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {sheet.registered.length === 0 ? (
              <p className="text-sm text-ui-subtle">Nobody registered for this event.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {sheet.registered.map((person) => (
                  <li key={person.user_id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{fullName(person)}</span>
                      <span className="block truncate text-xs text-ui-subtle">{person.email}</span>
                    </span>
                    {person.checked_in && person.record_id ? (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => undo.mutate(person.record_id as number)}>
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
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Add someone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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
                  <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                    {searching && <li className="py-2 text-xs text-ui-subtle">Searching...</li>}
                    {!searching && (searchResults ?? []).length === 0 && (
                      <li className="py-2 text-xs text-ui-subtle">No members match.</li>
                    )}
                    {(searchResults ?? []).map((member) => {
                      const already = checkedInIds.has(member.id);
                      return (
                        <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{fullName(member)}</span>
                            <span className="block truncate text-xs text-ui-subtle">{member.email}</span>
                          </span>
                          <Button
                            size="sm"
                            variant={already ? 'outline' : 'default'}
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Walk-ins ({sheet.walk_in_members.length + sheet.guests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sheet.walk_in_members.length + sheet.guests.length === 0 ? (
                <p className="text-sm text-ui-subtle">No walk-ins yet.</p>
              ) : (
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {sheet.walk_in_members.map((person) => (
                    <li key={`m-${person.record_id}`} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 truncate">
                        {fullName(person)} <span className="text-xs text-ui-subtle">member</span>
                      </span>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => undo.mutate(person.record_id)}>
                        Undo
                      </Button>
                    </li>
                  ))}
                  {sheet.guests.map((guest) => (
                    <li key={`g-${guest.record_id}`} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0 truncate">
                        {guest.guest_name} <span className="text-xs text-ui-subtle">guest</span>
                      </span>
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => undo.mutate(guest.record_id)}>
                        Undo
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
