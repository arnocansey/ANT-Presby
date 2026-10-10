import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import { ChoiceField, FormMessage, FormTextField, LoadingList, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAdminSermons,
  useCreateAdminSermon,
  useDeleteAdminSermon,
  useMinistries,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type SermonFormValues = {
  title: string;
  speaker: string;
  description: string;
  videoUrl: string;
  sermonDate: string;
  ministryId: string;
};

export default function AdminSermonsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const sermonsQuery = useAdminSermons(isAdmin);
  const ministriesQuery = useMinistries(isAdmin);
  const createMutation = useCreateAdminSermon();
  const deleteMutation = useDeleteAdminSermon();
  const { control, handleSubmit, reset } = useForm<SermonFormValues>({
    defaultValues: {
      title: '',
      speaker: '',
      description: '',
      videoUrl: '',
      sermonDate: '',
      ministryId: '',
    },
  });

  const onSubmit = async (values: SermonFormValues) => {
    try {
      await createMutation.mutateAsync({
        title: values.title,
        speaker: values.speaker,
        description: values.description,
        videoUrl: values.videoUrl || undefined,
        sermonDate: values.sermonDate || undefined,
        ministryId: Number(values.ministryId),
      });
      reset();
    } catch {
      // Inline error state handles this.
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin sermons"
          title="Admin access required"
          subtitle="Sign in with an admin account to manage sermons from mobile."
        />
      </Screen>
    );
  }

  const sermons = sermonsQuery.data || [];
  const ministries = ministriesQuery.data || [];
  const ministryOptions = ministries.map((item: any) => ({ value: String(item.id), label: String(item.name) }));
  const createError = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create sermon.')
    : '';

  return (
    <AdminShell activeTab="/admin-sermons">
      <ScreenHeader back eyebrow="Admin" title="Sermons" />

      <AppCard>
        <AppText variant="section">Create a sermon</AppText>
        <FormTextField control={control} name="title" label="Title" placeholder="Sermon title" />
        <FormTextField control={control} name="speaker" label="Speaker" placeholder="Speaker name" />
        <FormTextField control={control} name="description" label="Description" placeholder="Sermon summary" multiline />
        <FormTextField control={control} name="videoUrl" label="Video URL" placeholder="Optional video link" autoCapitalize="none" />
        <FormTextField
          control={control}
          name="sermonDate"
          label="Sermon date"
          placeholder="2026-04-20T09:00:00.000Z"
          hint="ISO format, for example 2026-04-20T09:00:00.000Z"
          autoCapitalize="none"
        />
        {ministryOptions.length > 0 ? (
          <Controller
            control={control}
            name="ministryId"
            render={({ field: { value, onChange } }) => (
              <ChoiceField label="Ministry" options={ministryOptions} value={value} onChange={onChange} />
            )}
          />
        ) : (
          <FormTextField control={control} name="ministryId" label="Ministry ID" placeholder="Numeric ministry ID" keyboardType="number-pad" />
        )}
        <AppButton label="Create sermon" onPress={handleSubmit(onSubmit)} loading={createMutation.isPending} />
        {createError ? <FormMessage tone="danger">{createError}</FormMessage> : null}
      </AppCard>

      <SectionHeader title="Recent sermons" />
      {sermonsQuery.isLoading ? (
        <LoadingList count={3} height={120} />
      ) : sermons.length > 0 ? (
        sermons.slice(0, 8).map((sermon: any) => (
          <AppCard key={String(sermon?.id)}>
            <AppBadge>{String(sermon?.speaker || 'Sermon')}</AppBadge>
            <AppText variant="bodyStrong">{sermon?.title || 'Untitled sermon'}</AppText>
            <AppText variant="small" tone="muted" numberOfLines={3}>
              {sermon?.description || 'No description available.'}
            </AppText>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton label="Edit sermon" size="sm" variant="secondary" onPress={() => router.push(`/admin-sermons/${sermon?.id}` as never)} />
              </View>
              <View style={styles.flex}>
                <AppButton label="Delete sermon" size="sm" variant="danger" onPress={() => deleteMutation.mutate(Number(sermon?.id))} />
              </View>
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyState icon="play-circle-outline" title="No sermons available" />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm },
});
