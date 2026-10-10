import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ErrorState, FormMessage, ListGroup, ListRow, LoadingList, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { MIN_TOUCH, Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAttendanceSummary,
  useCheckInEvents,
  useCheckIn,
  useEventAttendance,
  useMemberSearch,
  useUndoCheckIn,
} from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

export default function AdminAttendanceScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const [selectedEventId, setSelectedEventId] = React.useState<number | undefined>();
  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');

  const eventsQuery = useCheckInEvents(isAdmin);
  const summaryQuery = useAttendanceSummary(isAdmin && !selectedEventId);
  const sheetQuery = useEventAttendance(isAdmin ? selectedEventId : undefined);
  const searchQuery = useMemberSearch(searchTerm, isAdmin && Boolean(selectedEventId));
  const checkInMutation = useCheckIn(selectedEventId);
  const undoMutation = useUndoCheckIn();

  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (!user || !isAdmin) return null;

  const busy = checkInMutation.isPending || undoMutation.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));
  const checkInMember = (userId: number) => checkInMutation.mutate({ userId }, { onError: showError('Could not check in') });
  const undo = (recordId: number) => undoMutation.mutate(recordId, { onError: showError('Could not undo') });
  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    checkInMutation.mutate({ guestName: name }, { onSuccess: () => setGuestName(''), onError: showError('Could not add guest') });
  };

  const openEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    setSearchInput('');
    setGuestName('');
  };

  const personRow = (key: string, name: string, action: React.ReactNode) => (
    <View key={key} style={[styles.row, { borderTopColor: colors.border }]}>
      <AppText variant="small" style={styles.flex} numberOfLines={1}>
        {name}
      </AppText>
      {action}
    </View>
  );

  if (!selectedEventId) {
    const events = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];
    const summary = Array.isArray(summaryQuery.data) ? summaryQuery.data : [];

    return (
      <AdminShell activeTab="/admin-events">
        <ScreenHeader back eyebrow="Admin" title="Attendance" subtitle="Choose an event to check people in" />

        {eventsQuery.isLoading ? <LoadingList count={2} height={56} /> : null}
        {!eventsQuery.isLoading && events.length === 0 ? (
          <AppText variant="small" tone="muted">
            No events in the last or next two weeks.
          </AppText>
        ) : null}
        {events.length > 0 ? (
          <ListGroup>
            {events.map((event) => (
              <ListRow
                key={String(event.id)}
                icon="calendar-outline"
                label={event?.name || 'Event'}
                description={event?.event_date ? new Date(event.event_date).toLocaleString() : 'Date TBD'}
                onPress={() => openEvent(Number(event.id))}
              />
            ))}
          </ListGroup>
        ) : null}

        {summary.length > 0 ? (
          <AppCard>
            <AppText variant="bodyStrong">Recent headcounts</AppText>
            {summary.map((row) =>
              personRow(String(row.event_id), row.name, <AppBadge>{`${row.total} (${row.guests} guests)`}</AppBadge>)
            )}
          </AppCard>
        ) : null}
      </AdminShell>
    );
  }

  const sheet = sheetQuery.data;
  const checkedInIds = new Set([
    ...(sheet?.registered ?? []).filter((p) => p.checked_in).map((p) => p.user_id),
    ...(sheet?.walk_in_members ?? []).map((p) => p.user_id),
  ]);
  const cancelled = sheet?.event.status === 'cancelled';
  const searchResults = Array.isArray(searchQuery.data) ? searchQuery.data : [];

  return (
    <AdminShell activeTab="/admin-events">
      <ScreenHeader onBack={() => setSelectedEventId(undefined)} eyebrow="Check-in" title={sheet?.event.name || 'Check-in'} />

      {sheetQuery.isLoading ? (
        <LoadingList count={3} height={72} />
      ) : sheetQuery.isError || !sheet ? (
        <ErrorState title="Could not load this event" onRetry={() => sheetQuery.refetch()} />
      ) : (
        <>
          <View style={styles.badges}>
            <AppBadge tone="success">{`${sheet.totals.total} present`}</AppBadge>
            <AppBadge>{`${sheet.totals.checked_in_members} members`}</AppBadge>
            <AppBadge>{`${sheet.totals.guests} guests`}</AppBadge>
            <AppBadge>{`${sheet.totals.registered} registered`}</AppBadge>
          </View>
          {cancelled ? <FormMessage tone="danger">This event was cancelled; check-in is closed.</FormMessage> : null}

          <AppCard>
            <AppText variant="bodyStrong">{`Registered (${sheet.registered.length})`}</AppText>
            {sheet.registered.length === 0 ? (
              <AppText variant="small" tone="muted">
                Nobody registered for this event.
              </AppText>
            ) : (
              sheet.registered.map((person) =>
                personRow(
                  String(person.user_id),
                  fullName(person),
                  person.checked_in && person.record_id ? (
                    <AppButton label="Undo" size="sm" variant="secondary" onPress={() => !busy && undo(person.record_id as number)} />
                  ) : (
                    <AppButton label="Check in" size="sm" onPress={() => !busy && !cancelled && checkInMember(person.user_id)} />
                  )
                )
              )
            )}
          </AppCard>

          {!cancelled ? (
            <AppCard>
              <AppText variant="bodyStrong">Add someone</AppText>
              <TextField
                label="Find a member"
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Name or email"
                autoCapitalize="none"
              />
              {searchTerm.trim().length >= 2 ? (
                searchQuery.isFetching ? (
                  <ActivityIndicator color={colors.primary} />
                ) : searchResults.length === 0 ? (
                  <AppText variant="small" tone="muted">
                    No members match.
                  </AppText>
                ) : (
                  searchResults.map((member) => {
                    const already = checkedInIds.has(member.id);
                    return personRow(
                      String(member.id),
                      fullName(member),
                      <AppButton
                        label={already ? 'Checked in' : 'Check in'}
                        size="sm"
                        variant={already ? 'secondary' : 'primary'}
                        onPress={() => !already && !busy && checkInMember(member.id)}
                      />
                    );
                  })
                )
              ) : null}

              <TextField
                label="Walk-in guest"
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Guest's name"
                maxLength={255}
              />
              <AppButton label="Add guest" variant="secondary" onPress={() => !busy && addGuest()} />
            </AppCard>
          ) : null}

          <AppCard>
            <AppText variant="bodyStrong">{`Walk-ins (${sheet.walk_in_members.length + sheet.guests.length})`}</AppText>
            {sheet.walk_in_members.map((person) =>
              personRow(
                `m-${person.record_id}`,
                `${fullName(person)} · member`,
                <AppButton label="Undo" size="sm" variant="secondary" onPress={() => !busy && undo(person.record_id)} />
              )
            )}
            {sheet.guests.map((guest) =>
              personRow(
                `g-${guest.record_id}`,
                `${guest.guest_name} · guest`,
                <AppButton label="Undo" size="sm" variant="secondary" onPress={() => !busy && undo(guest.record_id)} />
              )
            )}
          </AppCard>
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    minHeight: MIN_TOUCH + 8,
    paddingTop: Space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
});
