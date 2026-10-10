import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ChipGroup, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useCheckInEvents,
  useGroups,
  useSendAnnouncement,
  useSentAnnouncements,
  type AnnouncementInput,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type Audience = 'everyone' | 'group' | 'event';

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'group', label: 'A group' },
  { value: 'event', label: 'An event' },
];

export default function AdminAnnouncementsScreen() {
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

  const sent = Array.isArray(sentQuery.data) ? sentQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <ScreenHeader back eyebrow="Admin" title="Send announcement" />

      <AppCard>
        <AppText variant="small" style={styles.bold}>
          Send to
        </AppText>
        <ChipGroup
          options={AUDIENCES}
          value={audience}
          onChange={(value) => {
            setAudience(value);
            setTargetId(undefined);
          }}
        />
        {targets.length > 0 ? (
          <ChipGroup
            options={targets.map((t) => ({ value: t.id as number | undefined, label: t.label }))}
            value={targetId}
            onChange={(value) => setTargetId(value)}
          />
        ) : audience !== 'everyone' ? (
          <AppText variant="small" tone="muted">
            {audience === 'group' ? 'No groups yet.' : 'No events in the last or next two weeks.'}
          </AppText>
        ) : null}
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Title" maxLength={255} />
        <TextField label="Message" value={message} onChangeText={setMessage} placeholder="Message" maxLength={2000} multiline />
        <AppButton label="Send announcement" onPress={() => !sendMutation.isPending && onSend()} />
      </AppCard>

      {sent.length > 0 ? <SectionHeader title="Sent" /> : null}
      {sent.map((item) => (
        <AppCard key={item.id}>
          <View style={styles.row}>
            <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>
              {item.title}
            </AppText>
            <AppBadge>{`${item.recipient_count} people`}</AppBadge>
          </View>
          <AppText variant="small" numberOfLines={2}>
            {item.message}
          </AppText>
          <AppText variant="caption" tone="muted">
            {new Date(item.created_at).toLocaleString()} · {item.push_count} phones
          </AppText>
        </AppCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
});
