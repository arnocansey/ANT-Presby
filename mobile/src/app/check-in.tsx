import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { CardScanner } from '@/components/attendance/card-scanner';
import { HeadcountCard } from '@/components/attendance/headcount-card';
import { ErrorState, FormMessage, ListGroup, ListRow, LoadingList, Screen, ScreenHeader } from '@/components/kit';
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
  useMyProfile,
  useUndoCheckIn,
} from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const fullName = (person?: { first_name: string; last_name: string }) =>
  `${person?.first_name || ''} ${person?.last_name || ''}`.trim() || 'Member';

const isForbidden = (error: unknown) => (error as any)?.response?.status === 403;

// Check-in for admins and ushers (members whose "Can take attendance" switch is on).
export default function CheckInScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const profileQuery = useMyProfile(Boolean(user) && !isAdmin);
  const allowed = isAdmin || Boolean(profileQuery.data?.can_take_attendance);
  const { refetch: refetchProfile } = profileQuery;

  // A cached profile from before an admin turned the usher switch on must not block: re-check on open.
  React.useEffect(() => {
    if (user && !isAdmin) refetchProfile();
  }, [user, isAdmin, refetchProfile]);

  const [selectedEventId, setSelectedEventId] = React.useState<number | undefined>();
  const [eventSearchInput, setEventSearchInput] = React.useState('');
  const [eventSearch, setEventSearch] = React.useState('');
  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const eventsQuery = useCheckInEvents(allowed, eventSearch);
  const summaryQuery = useAttendanceSummary(isAdmin && !selectedEventId);
  const sheetQuery = useEventAttendance(allowed ? selectedEventId : undefined);
  const searchQuery = useMemberSearch(searchTerm, allowed && Boolean(selectedEventId));
  const checkInMutation = useCheckIn(selectedEventId);
  const undoMutation = useUndoCheckIn();

  // Wait for a pause in typing before searching.
  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);
  React.useEffect(() => {
    const timer = setTimeout(() => setEventSearch(eventSearchInput), 300);
    return () => clearTimeout(timer);
  }, [eventSearchInput]);

  // The usher switch was turned off while this screen was open.
  const lostAccess = isForbidden(eventsQuery.error) || isForbidden(sheetQuery.error);
  React.useEffect(() => {
    if (lostAccess) {
      Alert.alert('You no longer have attendance access');
      router.replace('/(tabs)/account' as never);
    }
  }, [lostAccess]);

  if (!user) return null;

  if (!isAdmin && !allowed && profileQuery.isFetching) {
    return (
      <Screen>
        <ScreenHeader back title="Take attendance" />
        <LoadingList count={3} height={56} />
      </Screen>
    );
  }

  if (!allowed) {
    return (
      <Screen>
        <ScreenHeader back title="Take attendance" />
        {profileQuery.isError ? (
          <ErrorState title="Could not check your access" onRetry={() => refetchProfile()} />
        ) : (
          <ErrorState title="You do not have attendance access" message="Ask an admin to turn on usher access for your account." />
        )}
      </Screen>
    );
  }

  const busy = checkInMutation.isPending || undoMutation.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));
  const checkInMember = (userId: number) => checkInMutation.mutate({ userId }, { onError: showError('Could not check in') });
  const undo = (recordId: number) => undoMutation.mutate(recordId, { onError: showError('Could not undo') });
  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    checkInMutation.mutate({ guestName: name }, { onSuccess: () => setGuestName(''), onError: showError('Could not add guest') });
  };
  const scanCard = (text: string) =>
    checkInMutation.mutateAsync({ code: text }).then(
      (result) => `${fullName(result.member)}${result.already ? ' was already checked in' : ' checked in'}`,
      (error) => {
        throw new Error(getApiErrorMessage(error, 'Could not check in'));
      }
    );

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
    const searching = eventSearch.trim().length >= 2;

    return (
      <Screen>
        <ScreenHeader back eyebrow="Attendance" title="Take attendance" subtitle="Choose an event to check people in" />

        <TextField
          label="Find an older event"
          value={eventSearchInput}
          onChangeText={setEventSearchInput}
          placeholder="Event name (at least 2 letters)"
        />

        {eventsQuery.isLoading ? <LoadingList count={2} height={56} /> : null}
        {!eventsQuery.isLoading && events.length === 0 ? (
          <AppText variant="small" tone="muted">
            {searching ? 'No events match.' : 'No events in the last or next two weeks.'}
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

        {isAdmin && summary.length > 0 ? (
          <AppCard>
            <AppText variant="bodyStrong">Recent headcounts</AppText>
            {summary.map((row) =>
              personRow(String(row.event_id), row.name, <AppBadge>{`${row.total} (${row.named} named)`}</AppBadge>)
            )}
          </AppCard>
        ) : null}
      </Screen>
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
    <Screen>
      <ScreenHeader onBack={() => setSelectedEventId(undefined)} eyebrow="Check-in" title={sheet?.event.name || 'Check-in'} />

      {sheetQuery.isLoading ? (
        <LoadingList count={3} height={72} />
      ) : sheetQuery.isError || !sheet ? (
        <ErrorState title="Could not load this event" onRetry={() => sheetQuery.refetch()} />
      ) : (
        <>
          <View style={styles.badges}>
            <AppBadge tone="success">{`${sheet.totals.total} present`}</AppBadge>
            <AppBadge>{`${sheet.totals.named} named`}</AppBadge>
            <AppBadge>{`${sheet.totals.adults} adults`}</AppBadge>
            <AppBadge>{`${sheet.totals.children} children`}</AppBadge>
          </View>
          {cancelled ? <FormMessage tone="danger">This event was cancelled; check-in is closed.</FormMessage> : null}

          {!cancelled ? (
            <AppButton
              label="Scan cards"
              icon={<Ionicons name="qr-code-outline" size={18} color={colors.onPrimary} />}
              onPress={() => setScannerOpen(true)}
            />
          ) : null}

          <HeadcountCard sheet={sheet} disabled={Boolean(cancelled)} />

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

              <TextField label="Walk-in guest" value={guestName} onChangeText={setGuestName} placeholder="Guest's name" maxLength={255} />
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

          <CardScanner visible={scannerOpen} onClose={() => setScannerOpen(false)} onScan={scanCard} />
        </>
      )}
    </Screen>
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
