'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarX } from 'lucide-react';
import toast from 'react-hot-toast';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSection } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import CameraScanner from '@/components/attendance/CameraScanner';
import HeadcountCard from '@/components/attendance/HeadcountCard';
import ScanBox from '@/components/attendance/ScanBox';
import { useLeaveOnLostAccess } from '@/components/attendance/StaffGuard';
import {
  downloadCsv,
  useAttendanceMemberSearch,
  useCheckIn,
  useEventAttendance,
  useUndoCheckIn,
  type CheckInInput,
} from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';

const fullName = (person?: { first_name: string; last_name: string }) =>
  `${person?.first_name || ''} ${person?.last_name || ''}`.trim() || 'Member';

const crumbs = [{ label: 'Check-in', href: '/check-in' }];

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

// The check-in sheet for one event, used by admins and ushers.
export default function CheckInSheet({ eventId }: { eventId?: number }) {
  const { data: sheet, isLoading, error, refetch } = useEventAttendance(eventId);
  useLeaveOnLostAccess(error);
  const checkIn = useCheckIn(eventId);
  const undo = useUndoCheckIn();
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin');

  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const { data: searchResults, isFetching: searching } = useAttendanceMemberSearch(searchTerm);

  // Wait for a pause in typing before searching.
  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const checkInWith = (input: CheckInInput) =>
    checkIn.mutate(input, {
      onSuccess: (result) => {
        if ('guestName' in input) {
          setGuestName('');
          setStatus(`${input.guestName} added`);
          return;
        }
        const name = fullName(result?.member);
        setStatus(result?.already ? `${name} was already checked in` : `${name} checked in`);
      },
      onError: (err: any) => {
        const message = err?.response?.data?.message || 'Could not check in';
        setStatus(message);
        toast.error(message);
      },
    });
  const scan = (text: string) => checkInWith({ code: text });

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
    checkInWith({ guestName: name });
  };

  // Keep showing a loaded sheet if a background refresh fails (e.g. a flaky connection mid check-in).
  const notFound = !eventId || (error as any)?.response?.status === 404;

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={crumbs} title="Check-in" />
        <EmptyState
          icon={CalendarX}
          title="This event could not be found."
          action={
            <Button asChild variant="secondary">
              <Link href="/check-in">Back to check-in</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (error && !sheet) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={crumbs} title="Check-in" />
        <LoadError what="the check-in sheet" onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !sheet) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={crumbs} title="Check-in" />
        <CardListSkeleton count={3} label="Loading check-in sheet" className="grid gap-6 lg:grid-cols-2" />
      </div>
    );
  }

  const exportCsv = () =>
    downloadCsv(`/admin/attendance/events/${sheet.event.id}/export.csv`, {}, `attendance-${sheet.event.id}.csv`).catch(() =>
      toast.error('Could not download the CSV')
    );

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[...crumbs, { label: sheet.event.name }]}
        title={sheet.event.name}
        description={`${formatDateTime(sheet.event.event_date)}${sheet.event.location ? ` · ${sheet.event.location}` : ''}`}
        actions={
          isAdmin ? (
            <Button variant="secondary" onClick={exportCsv}>
              Download CSV
            </Button>
          ) : undefined
        }
      />

      <div className="space-y-3">
        {cancelled && (
          <p role="status" className="text-sm font-semibold text-danger">
            This event was cancelled; check-in is closed.
          </p>
        )}
        <div className="flex flex-wrap gap-2" aria-label="Totals">
          <Badge tone="gold">{sheet.totals.total} present</Badge>
          <Badge tone="neutral">{sheet.totals.named} named</Badge>
          <Badge tone="neutral">{sheet.totals.adults} adults</Badge>
          <Badge tone="neutral">{sheet.totals.children} children</Badge>
          <Badge tone="neutral">{sheet.totals.registered} registered</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <HeadcountCard sheet={sheet} disabled={cancelled} />
        <FormSection title="Scan member cards" description="Use a card scanner or the camera.">
          <div className="space-y-4">
            <ScanBox onScan={scan} disabled={cancelled || checkIn.isPending} />
            {cameraOpen ? (
              <CameraScanner onScan={scan} onClose={() => setCameraOpen(false)} />
            ) : (
              <Button type="button" variant="secondary" disabled={cancelled} onClick={() => setCameraOpen(true)}>
                Use camera
              </Button>
            )}
            <p role="status" aria-live="polite" className="min-h-5 text-sm font-medium text-foreground">
              {status}
            </p>
          </div>
        </FormSection>
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
                    <Button size="sm" disabled={busy || cancelled} onClick={() => checkInWith({ userId: person.user_id })}>
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
                    {!searching && (searchResults ?? []).length === 0 && <li className="py-2 text-xs text-muted">No members match.</li>}
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
                            onClick={() => checkInWith({ userId: member.id })}
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
