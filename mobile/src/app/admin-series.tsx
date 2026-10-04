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
  useDeleteSermonSeries,
  useSaveSermonSeries,
  useSermonSeriesList,
  type SeriesInput,
  type SermonSeriesSummary,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const EMPTY: SeriesInput = { title: '', description: '', startDate: '', endDate: '' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Date-only values arrive as midnight UTC; show them in UTC so they don't shift a day.
const formatDateOnly = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '';

export default function AdminSeriesScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const seriesQuery = useSermonSeriesList(isAdmin);
  const saveMutation = useSaveSermonSeries();
  const deleteMutation = useDeleteSermonSeries();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<SeriesInput>(EMPTY);

  if (!user || !isAdmin) return null;

  const seriesList = Array.isArray(seriesQuery.data) ? seriesQuery.data : [];

  const setField = (field: keyof SeriesInput) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const startEdit = (series: SermonSeriesSummary) => {
    setEditingId(series.id);
    setForm({
      title: series.title,
      description: series.description || '',
      startDate: series.start_date ? series.start_date.slice(0, 10) : '',
      endDate: series.end_date ? series.end_date.slice(0, 10) : '',
    });
  };

  const onSave = () => {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Give the series a title.');
      return;
    }
    const badDate = [form.startDate, form.endDate].find((value) => value && !DATE_PATTERN.test(value));
    if (badDate) {
      Alert.alert('Check the dates', 'Use the format YYYY-MM-DD, for example 2026-09-01.');
      return;
    }
    saveMutation.mutate(
      { id: editingId, input: form },
      {
        onSuccess: resetForm,
        onError: (error) => Alert.alert('Could not save', getApiErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const confirmDelete = (series: SermonSeriesSummary) =>
    Alert.alert(
      `Delete "${series.title}"?`,
      `Its ${series.sermon_count} sermon(s) will stay in the library without a series.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(series.id, {
              onSuccess: () => {
                if (editingId === series.id) resetForm();
              },
              onError: (error) => Alert.alert('Could not delete', getApiErrorMessage(error, 'Please try again.')),
            }),
        },
      ]
    );

  const input = (field: keyof SeriesInput, placeholder: string, multiline = false) => (
    <TextInput
      value={form[field]}
      onChangeText={setField(field)}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      multiline={multiline}
      style={[
        styles.input,
        multiline && styles.multiline,
        { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
      ]}
    />
  );

  return (
    <AdminShell activeTab="/admin-sermons">
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#C084FC', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Series Manager</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="defaultSemiBold">{editingId ? 'Edit series' : 'New series'}</ThemedText>
        {input('title', 'Series title')}
        {input('description', 'Description (optional)', true)}
        {input('startDate', 'Start date YYYY-MM-DD (optional)')}
        {input('endDate', 'End date YYYY-MM-DD (optional)')}
        <BrandButton label={editingId ? 'Save changes' : 'Create series'} onPress={onSave} variant="secondary" />
        {editingId ? <BrandButton label="Cancel" onPress={resetForm} variant="outline" /> : null}
      </BrandCard>

      {seriesQuery.isError ? (
        <BrandCard>
          <ThemedText type="small">Could not load series.</ThemedText>
          <BrandButton label="Try again" onPress={() => seriesQuery.refetch()} />
        </BrandCard>
      ) : seriesList.length === 0 && !seriesQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small" themeColor="textSecondary">
            No series yet. Create one above, then choose it on a sermon.
          </ThemedText>
        </BrandCard>
      ) : (
        seriesList.map((series) => (
          <BrandCard key={series.id}>
            <View style={styles.seriesRow}>
              <ThemedText type="defaultSemiBold" style={styles.seriesTitle}>
                {series.title}
              </ThemedText>
              <BrandPill>{`${series.sermon_count} sermons`}</BrandPill>
            </View>
            {series.start_date ? (
              <ThemedText type="small" themeColor="textSecondary">
                {formatDateOnly(series.start_date)}
                {series.end_date ? ` – ${formatDateOnly(series.end_date)}` : ''}
              </ThemedText>
            ) : null}
            <View style={styles.actions}>
              <BrandButton label="Edit" onPress={() => startEdit(series)} variant="outline" />
              <BrandButton label="Delete" onPress={() => confirmDelete(series)} variant="outline" />
            </View>
          </BrandCard>
        ))
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 90, textAlignVertical: 'top' },
  seriesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  seriesTitle: { flex: 1 },
  actions: { flexDirection: 'row', gap: Spacing.two },
});
