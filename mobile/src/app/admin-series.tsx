import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ErrorState, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useDeleteSermonSeries,
  useSaveSermonSeries,
  useSermonSeriesList,
  type SeriesInput,
  type SermonSeriesSummary,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

const EMPTY: SeriesInput = { title: '', description: '', startDate: '', endDate: '' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Date-only values arrive as midnight UTC; show them in UTC so they don't shift a day.
const formatDateOnly = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '';

export default function AdminSeriesScreen() {
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

  return (
    <AdminShell activeTab="/admin-sermons">
      <ScreenHeader back eyebrow="Admin" title="Series" />

      <AppCard>
        <AppText variant="section">{editingId ? 'Edit series' : 'New series'}</AppText>
        <TextField label="Series title" value={form.title} onChangeText={setField('title')} placeholder="Series title" />
        <TextField label="Description (optional)" value={form.description} onChangeText={setField('description')} placeholder="Description" multiline />
        <TextField label="Start date (optional)" value={form.startDate} onChangeText={setField('startDate')} placeholder="YYYY-MM-DD" />
        <TextField label="End date (optional)" value={form.endDate} onChangeText={setField('endDate')} placeholder="YYYY-MM-DD" />
        <AppButton label={editingId ? 'Save changes' : 'Create series'} onPress={onSave} />
        {editingId ? <AppButton label="Cancel" variant="secondary" onPress={resetForm} /> : null}
      </AppCard>

      {seriesQuery.isError ? (
        <ErrorState title="Could not load series" onRetry={() => seriesQuery.refetch()} />
      ) : seriesList.length === 0 && !seriesQuery.isLoading ? (
        <EmptyState icon="albums-outline" title="No series yet" message="Create one above, then choose it on a sermon." />
      ) : (
        seriesList.map((series) => (
          <AppCard key={series.id}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {series.title}
              </AppText>
              <AppBadge>{`${series.sermon_count} sermons`}</AppBadge>
            </View>
            {series.start_date ? (
              <AppText variant="small" tone="muted">
                {formatDateOnly(series.start_date)}
                {series.end_date ? ` – ${formatDateOnly(series.end_date)}` : ''}
              </AppText>
            ) : null}
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton label="Edit" size="sm" variant="secondary" onPress={() => startEdit(series)} />
              </View>
              <View style={styles.flex}>
                <AppButton label="Delete" size="sm" variant="danger" onPress={() => confirmDelete(series)} />
              </View>
            </View>
          </AppCard>
        ))
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm },
});
