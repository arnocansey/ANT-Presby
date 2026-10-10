import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ChoiceField, FormMessage, FormTextField, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import {
  getApiErrorMessage,
  useAdminSermons,
  useMinistries,
  useSermonSeriesList,
  useUpdateAdminSermon,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type SermonFormValues = {
  title: string;
  speaker: string;
  description: string;
  videoUrl: string;
  sermonDate: string;
  ministryId: string;
  seriesId: string;
};

export default function AdminSermonEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const sermonsQuery = useAdminSermons(isAdmin);
  const ministriesQuery = useMinistries(isAdmin);
  const seriesQuery = useSermonSeriesList(isAdmin);
  const updateMutation = useUpdateAdminSermon();
  const { control, handleSubmit, reset, watch, setValue } = useForm<SermonFormValues>({
    defaultValues: { title: '', speaker: '', description: '', videoUrl: '', sermonDate: '', ministryId: '', seriesId: '' },
  });
  const selectedSeriesId = watch('seriesId');

  const sermon = React.useMemo(
    () => (sermonsQuery.data || []).find((item: any) => String(item?.id) === String(params.id)),
    [sermonsQuery.data, params.id]
  );

  React.useEffect(() => {
    if (sermon) {
      reset({
        title: sermon.title || '',
        speaker: sermon.speaker || '',
        description: sermon.description || '',
        videoUrl: sermon.video_url || sermon.videoUrl || '',
        sermonDate: sermon.sermon_date || sermon.sermonDate || '',
        ministryId: sermon.ministry_id ? String(sermon.ministry_id) : sermon.ministryId ? String(sermon.ministryId) : '',
        seriesId: sermon.series_id ? String(sermon.series_id) : '',
      });
    }
  }, [sermon, reset]);

  const onSubmit = async (values: SermonFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: Number(params.id),
        payload: {
          title: values.title,
          speaker: values.speaker,
          description: values.description,
          videoUrl: values.videoUrl || undefined,
          sermonDate: values.sermonDate || undefined,
          ministryId: Number(values.ministryId),
          seriesId: values.seriesId ? Number(values.seriesId) : null,
        },
      });
      router.back();
    } catch {
      // inline error handles this
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Edit sermon" title="Admin access required" subtitle="Sign in with an admin account to edit sermons." />
      </Screen>
    );
  }

  const ministryOptions = (ministriesQuery.data || []).map((item: any) => ({ value: String(item.id), label: String(item.name) }));
  const seriesOptions = [
    { value: '', label: 'No series' },
    ...(seriesQuery.data || []).map((s) => ({ value: String(s.id), label: s.title })),
  ];

  return (
    <Screen>
      <ScreenHeader back eyebrow="Edit sermon" title={sermon?.title || 'Edit sermon'} />
      {!sermon ? (
        <LoadingList count={3} height={72} />
      ) : (
        <AppCard>
          <FormTextField control={control} name="title" label="Title" placeholder="Sermon title" />
          <FormTextField control={control} name="speaker" label="Speaker" placeholder="Speaker" />
          <FormTextField control={control} name="description" label="Description" placeholder="Sermon description" multiline />
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
          <ChoiceField
            label="Series"
            options={seriesOptions}
            value={selectedSeriesId}
            onChange={(value) => setValue('seriesId', value)}
          />
          <AppButton label="Save changes" onPress={handleSubmit(onSubmit)} loading={updateMutation.isPending} />
          {updateMutation.isError ? (
            <FormMessage tone="danger">{getApiErrorMessage(updateMutation.error, 'Failed to update sermon.')}</FormMessage>
          ) : null}
        </AppCard>
      )}
    </Screen>
  );
}
