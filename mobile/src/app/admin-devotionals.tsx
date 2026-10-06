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
  useAdminDevotionals,
  useDeleteDevotional,
  usePublishDevotional,
  useSaveDevotional,
  type Devotional,
  type DevotionalInput,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type FormState = { title: string; scriptureReference: string; scriptureText: string; body: string; prayer: string; publishDate: string };
const EMPTY: FormState = { title: '', scriptureReference: '', scriptureText: '', body: '', prayer: '', publishDate: '' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function AdminDevotionalsScreen() {
  const theme = useTheme();
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

  const input = (field: keyof FormState, placeholder: string, multiline = false) => (
    <TextInput
      value={form[field]}
      onChangeText={setField(field)}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      multiline={multiline}
      style={[styles.input, multiline && styles.multiline, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
    />
  );

  const items = Array.isArray(listQuery.data) ? listQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Devotionals</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="defaultSemiBold">{editingId ? 'Edit devotional' : 'New devotional'}</ThemedText>
        {input('publishDate', 'Date YYYY-MM-DD')}
        {input('title', 'Title')}
        {input('scriptureReference', 'Scripture reference, e.g. Psalm 23:1-3')}
        {input('scriptureText', 'Scripture text', true)}
        {input('body', 'Reflection', true)}
        {input('prayer', 'Closing prayer (optional)', true)}
        <BrandButton label={editingId ? 'Save changes' : 'Save draft'} variant="secondary" onPress={() => !busy && onSave()} />
        {editingId ? <BrandButton label="Cancel" variant="outline" onPress={resetForm} /> : null}
      </BrandCard>

      {items.map((item) => (
        <BrandCard key={item.id}>
          <View style={styles.row}>
            <ThemedText type="defaultSemiBold" style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            <BrandPill>{item.status}</BrandPill>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {item.publish_date}
            {item.notified_at ? ' · everyone notified' : ''}
          </ThemedText>
          <View style={styles.actions}>
            <BrandButton label="Edit" variant="outline" onPress={() => startEdit(item)} />
            {item.status === 'draft' || !item.notified_at ? (
              <BrandButton label={item.status === 'draft' ? 'Publish' : 'Publish & notify'} onPress={() => !busy && onPublish(item)} />
            ) : null}
            <BrandButton label="Delete" variant="outline" onPress={() => !busy && onDelete(item)} />
          </View>
        </BrandCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  rowTitle: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
