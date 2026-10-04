import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  getApiErrorMessage,
  useAdminEvents,
  useAttendanceSummary,
  useCheckIn,
  useEventAttendance,
  useMemberSearch,
  useUndoCheckIn,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

export default function AdminAttendanceScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const [selectedEventId, setSelectedEventId] = React.useState<number | undefined>();
  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');

  const eventsQuery = useAdminEvents(isAdmin);
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

  const header = (title: string, onBack: () => void) => (
    <View style={styles.headerRow}>
      <Pressable
        onPress={onBack}
        style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
        <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
      </Pressable>
      <View style={styles.headerCopy}>
        <ThemedText type="smallBold" style={{ color: '#34D399', textTransform: 'uppercase', letterSpacing: 1 }}>
          Admin
        </ThemedText>
        <ThemedText type="subtitle" numberOfLines={1}>
          {title}
        </ThemedText>
      </View>
    </View>
  );

  const inputStyle = [styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }];

  if (!selectedEventId) {
    const events = (Array.isArray(eventsQuery.data) ? eventsQuery.data : []).filter(
      (event: any) => event?.status !== 'cancelled'
    );
    const summary = Array.isArray(summaryQuery.data) ? summaryQuery.data : [];

    return (
      <AdminShell activeTab="/admin-events">
        {header('Attendance', () => router.back())}

        <ThemedText type="defaultSemiBold">Choose an event to check people in</ThemedText>
        {eventsQuery.isLoading ? <ActivityIndicator color={theme.tint} /> : null}
        {events.slice(0, 20).map((event: any) => (
          <Pressable key={String(event.id)} onPress={() => openEvent(Number(event.id))}>
            <BrandCard>
              <View style={styles.row}>
                <View style={styles.rowCopy}>
                  <ThemedText type="defaultSemiBold">{event?.name || 'Event'}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {event?.event_date ? new Date(event.event_date).toLocaleString() : 'Date TBD'}
                  </ThemedText>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
              </View>
            </BrandCard>
          </Pressable>
        ))}

        {summary.length > 0 ? (
          <BrandCard>
            <ThemedText type="defaultSemiBold">Recent headcounts</ThemedText>
            {summary.map((row) => (
              <View key={row.event_id} style={styles.row}>
                <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                  {row.name}
                </ThemedText>
                <BrandPill>{`${row.total} (${row.guests} guests)`}</BrandPill>
              </View>
            ))}
          </BrandCard>
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
      {header(sheet?.event.name || 'Check-in', () => setSelectedEventId(undefined))}

      {sheetQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : sheetQuery.isError || !sheet ? (
        <BrandCard>
          <ThemedText type="small">Could not load this event.</ThemedText>
          <BrandButton label="Try again" onPress={() => sheetQuery.refetch()} />
        </BrandCard>
      ) : (
        <>
          <View style={styles.pills}>
            <BrandPill>{`${sheet.totals.total} present`}</BrandPill>
            <BrandPill>{`${sheet.totals.checked_in_members} members`}</BrandPill>
            <BrandPill>{`${sheet.totals.guests} guests`}</BrandPill>
            <BrandPill>{`${sheet.totals.registered} registered`}</BrandPill>
          </View>
          {cancelled ? (
            <ThemedText type="smallBold" style={styles.errorText}>
              This event was cancelled; check-in is closed.
            </ThemedText>
          ) : null}

          <BrandCard>
            <ThemedText type="defaultSemiBold">Registered ({sheet.registered.length})</ThemedText>
            {sheet.registered.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                Nobody registered for this event.
              </ThemedText>
            ) : (
              sheet.registered.map((person) => (
                <View key={person.user_id} style={styles.row}>
                  <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                    {fullName(person)}
                  </ThemedText>
                  {person.checked_in && person.record_id ? (
                    <BrandButton label="Undo" variant="outline" onPress={() => !busy && undo(person.record_id as number)} />
                  ) : (
                    <BrandButton
                      label="Check in"
                      onPress={() => !busy && !cancelled && checkInMember(person.user_id)}
                    />
                  )}
                </View>
              ))
            )}
          </BrandCard>

          {!cancelled ? (
            <BrandCard>
              <ThemedText type="defaultSemiBold">Add someone</ThemedText>
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Find a member (name or email)"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                style={inputStyle}
              />
              {searchTerm.trim().length >= 2 ? (
                searchQuery.isFetching ? (
                  <ActivityIndicator color={theme.tint} />
                ) : searchResults.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No members match.
                  </ThemedText>
                ) : (
                  searchResults.map((member) => {
                    const already = checkedInIds.has(member.id);
                    return (
                      <View key={member.id} style={styles.row}>
                        <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                          {fullName(member)}
                        </ThemedText>
                        <BrandButton
                          label={already ? 'Checked in' : 'Check in'}
                          variant={already ? 'outline' : 'primary'}
                          onPress={() => !already && !busy && checkInMember(member.id)}
                        />
                      </View>
                    );
                  })
                )
              ) : null}

              <TextInput
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Walk-in guest's name"
                placeholderTextColor={theme.textSecondary}
                maxLength={255}
                style={inputStyle}
              />
              <BrandButton label="Add guest" variant="secondary" onPress={() => !busy && addGuest()} />
            </BrandCard>
          ) : null}

          <BrandCard>
            <ThemedText type="defaultSemiBold">
              Walk-ins ({sheet.walk_in_members.length + sheet.guests.length})
            </ThemedText>
            {sheet.walk_in_members.map((person) => (
              <View key={`m-${person.record_id}`} style={styles.row}>
                <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                  {`${fullName(person)} · member`}
                </ThemedText>
                <BrandButton label="Undo" variant="outline" onPress={() => !busy && undo(person.record_id)} />
              </View>
            ))}
            {sheet.guests.map((guest) => (
              <View key={`g-${guest.record_id}`} style={styles.row}>
                <ThemedText type="small" style={styles.rowCopy} numberOfLines={1}>
                  {`${guest.guest_name} · guest`}
                </ThemedText>
                <BrandButton label="Undo" variant="outline" onPress={() => !busy && undo(guest.record_id)} />
              </View>
            ))}
          </BrandCard>
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  rowCopy: { flex: 1, gap: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  errorText: { color: '#B91C1C' },
});
