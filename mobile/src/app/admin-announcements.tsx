import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  getApiErrorMessage,
  useCheckInEvents,
  useGroups,
  useSendAnnouncement,
  useSentAnnouncements,
  type AnnouncementInput,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type Audience = 'everyone' | 'group' | 'event';

export default function AdminAnnouncementsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const groupsQuery = useGroups();
  const eventsQuery = useCheckInEvents(isAdmin);
  const sentQuery = useSentAnnouncements(isAdmin);
  const sendMutation = useSendAnnouncement();
  const [audience, setAudience] = React.useState<Audience>('everyone');
  const [targetId, setTargetId] = React.useState<number | undefined>();
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');

  if (!user || !isAdmin) return null;

  const targets =
    audience === 'group'
      ? (groupsQuery.data ?? []).map((g) => ({ id: g.id, label: g.name }))
      : audience === 'event'
        ? (eventsQuery.data ?? []).map((e) => ({ id: e.id, label: e.name }))
        : [];

  const onSend = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Add a title and a message.');
      return;
    }
    if (audience !== 'everyone' && !targetId) {
      Alert.alert('Choose who to send to', audience === 'group' ? 'Pick a group.' : 'Pick an event.');
      return;
    }
    const base = { title: title.trim(), message: message.trim() };
    const input: AnnouncementInput =
      audience === 'group'
        ? { ...base, audience, groupId: targetId as number }
        : audience === 'event'
          ? { ...base, audience, eventId: targetId as number }
          : { ...base, audience: 'everyone' };
    sendMutation.mutate(input, {
      onSuccess: (data) => {
        Alert.alert('Sent', `Sent to ${data?.recipient_count ?? 0} people.`);
        setTitle('');
        setMessage('');
      },
      onError: (error) => Alert.alert('Could not send', getApiErrorMessage(error, 'Please try again.')),
    });
  };

  const chip = (label: string, active: boolean, onPress: () => void, key: string) => (
    <Pressable key={key} onPress={onPress}>
      <View style={[styles.chip, { backgroundColor: active ? theme.tint : theme.background, borderColor: active ? theme.tint : theme.border }]}>
        <ThemedText type="smallBold" style={{ color: active ? theme.white : theme.text }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );

  const inputStyle = [styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }];
  const sent = Array.isArray(sentQuery.data) ? sentQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#818CF8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Send Announcement</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="smallBold">Send to</ThemedText>
        <View style={styles.chips}>
          {(['everyone', 'group', 'event'] as Audience[]).map((value) =>
            chip(value === 'everyone' ? 'Everyone' : value === 'group' ? 'A group' : 'An event', audience === value, () => {
              setAudience(value);
              setTargetId(undefined);
            }, value)
          )}
        </View>
        {targets.length > 0 ? (
          <View style={styles.chips}>{targets.map((t) => chip(t.label, targetId === t.id, () => setTargetId(t.id), String(t.id)))}</View>
        ) : audience !== 'everyone' ? (
          <ThemedText type="small" themeColor="textSecondary">
            {audience === 'group' ? 'No groups yet.' : 'No events in the last or next two weeks.'}
          </ThemedText>
        ) : null}
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={theme.textSecondary} maxLength={255} style={inputStyle} />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Message"
          placeholderTextColor={theme.textSecondary}
          maxLength={2000}
          multiline
          style={[...inputStyle, styles.multiline]}
        />
        <BrandButton label="Send announcement" variant="secondary" onPress={() => !sendMutation.isPending && onSend()} />
      </BrandCard>

      {sent.map((item) => (
        <BrandCard key={item.id}>
          <View style={styles.row}>
            <ThemedText type="defaultSemiBold" style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <BrandPill>{`${item.recipient_count} people`}</BrandPill>
          </View>
          <ThemedText type="small" numberOfLines={2}>
            {item.message}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date(item.created_at).toLocaleString()} · {item.push_count} phones
          </ThemedText>
        </BrandCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  rowTitle: { flex: 1 },
});
