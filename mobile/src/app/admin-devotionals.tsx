import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ScreenHeader, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAdminDevotionals,
  useDeleteDevotional,
  usePublishDevotional,
  useSaveDevotional,
  type Devotional,
  type DevotionalInput,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type FormState = { title: string; scriptureReference: string; scriptureText: string; body: string; prayer: string; publishDate: string };
const EMPTY: FormState = { title: '', scriptureReference: '', scriptureText: '', body: '', prayer: '', publishDate: '' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function AdminDevotionalsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const listQuery = useAdminDevotionals(isAdmin);
  const save = useSaveDevotional();
  const remove = useDeleteDevotional();
  const publish = usePublishDevotional();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);

  if (!user || !isAdmin) return null;

  const busy = save.isPending || remove.isPending || publish.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));
  const setField = (field: keyof FormState) => (value: string) => setForm((current) => ({ ...current, [field]: value }));
  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const onSave = () => {
    if (!form.title.trim() || !form.scriptureReference.trim() || !form.scriptureText.trim() || !form.body.trim()) {
      Alert.alert('Missing details', 'Title, scripture reference, scripture text and reflection are required.');
      return;
    }
    if (!DATE_PATTERN.test(form.publishDate)) {
      Alert.alert('Check the date', 'Use the format YYYY-MM-DD, for example 2026-10-06.');
      return;
    }
    const input: DevotionalInput = {
      title: form.title.trim(),
      scriptureReference: form.scriptureReference.trim(),
      scriptureText: form.scriptureText.trim(),
      body: form.body.trim(),
      prayer: form.prayer.trim() || null,
      publishDate: form.publishDate,
    };
    save.mutate({ id: editingId, input }, { onSuccess: resetForm, onError: showError('Could not save') });
  };

  const startEdit = (item: Devotional) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      scriptureReference: item.scripture_reference,
      scriptureText: item.scripture_text,
      body: item.body,
      prayer: item.prayer || '',
      publishDate: item.publish_date,
    });
  };

  const onPublish = (item: Devotional) =>
    publish.mutate(item.id, {
      onSuccess: (data) => Alert.alert(data?.notified ? 'Published and everyone was notified' : 'Published'),
      onError: showError('Could not publish'),
    });

  const onDelete = (item: Devotional) =>
    Alert.alert(`Delete "${item.title}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(item.id, { onSuccess: () => editingId === item.id && resetForm(), onError: showError('Could not delete') }),
      },
    ]);

  const field = (key: keyof FormState, label: string, placeholder: string, multiline = false) => (
    <TextField label={label} value={form[key]} onChangeText={setField(key)} placeholder={placeholder} multiline={multiline} />
  );

  const items = Array.isArray(listQuery.data) ? listQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <ScreenHeader back eyebrow="Admin" title="Devotionals" />

      <AppCard>
        <AppText variant="section">{editingId ? 'Edit devotional' : 'New devotional'}</AppText>
        {field('publishDate', 'Date', 'YYYY-MM-DD')}
        {field('title', 'Title', 'Title')}
        {field('scriptureReference', 'Scripture reference', 'e.g. Psalm 23:1-3')}
        {field('scriptureText', 'Scripture text', 'Scripture text', true)}
        {field('body', 'Reflection', 'Reflection', true)}
        {field('prayer', 'Closing prayer (optional)', 'Closing prayer', true)}
        <AppButton label={editingId ? 'Save changes' : 'Save draft'} onPress={() => !busy && onSave()} />
        {editingId ? <AppButton label="Cancel" variant="secondary" onPress={resetForm} /> : null}
      </AppCard>

      {items.map((item) => (
        <AppCard key={item.id}>
          <View style={styles.row}>
            <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>
              {item.title}
            </AppText>
            <AppBadge tone={statusTone(item.status)}>{item.status}</AppBadge>
          </View>
          <AppText variant="small" tone="muted">
            {item.publish_date}
            {item.notified_at ? ' · everyone notified' : ''}
          </AppText>
          <View style={styles.actions}>
            <AppButton label="Edit" size="sm" variant="secondary" onPress={() => startEdit(item)} />
            {item.status === 'draft' || !item.notified_at ? (
              <AppButton
                label={item.status === 'draft' ? 'Publish' : 'Publish & notify'}
                size="sm"
                onPress={() => !busy && onPublish(item)}
              />
            ) : null}
            <AppButton label="Delete" size="sm" variant="danger" onPress={() => !busy && onDelete(item)} />
          </View>
        </AppCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
});
