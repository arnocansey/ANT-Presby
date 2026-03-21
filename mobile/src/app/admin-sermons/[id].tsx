import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAdminSermons, useMinistries, useUpdateAdminSermon } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type SermonFormValues = {
  title: string;
  speaker: string;
  description: string;
  videoUrl: string;
  sermonDate: string;
  ministryId: string;
};

export default function AdminSermonEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const sermonsQuery = useAdminSermons(isAdmin);
  const ministriesQuery = useMinistries(isAdmin);
  const updateMutation = useUpdateAdminSermon();
  const { control, handleSubmit, reset } = useForm<SermonFormValues>({
    defaultValues: { title: '', speaker: '', description: '', videoUrl: '', sermonDate: '', ministryId: '' },
  });

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
        },
      });
      router.back();
    } catch {
      // inline error handles this
    }
  };

  if (!user || !isAdmin) {
    return (
      <BrandScreen>
        <BrandHero eyebrow="Edit Sermon" title="Admin access required" description="Sign in with an admin account to edit sermons." />
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <BrandHero eyebrow="Edit Sermon" title={sermon?.title || 'Edit sermon'} description="Update the sermon details from the mobile admin app." />
      <BrandCard>
        <BrandPill>Edit</BrandPill>
        <BrandSectionHeader title="Edit sermon" description="Use the ministry IDs below if you need to reassign the sermon." />
        {!sermon ? (
          <ThemedText type="small">Loading sermon...</ThemedText>
        ) : (
          <>
            <Field control={control} name="title" label="Title" placeholder="Sermon title" />
            <Field control={control} name="speaker" label="Speaker" placeholder="Speaker" />
            <Field control={control} name="description" label="Description" placeholder="Sermon description" multiline />
            <Field control={control} name="videoUrl" label="Video URL" placeholder="Optional video link" />
            <Field control={control} name="sermonDate" label="Sermon Date" placeholder="2026-04-20T09:00:00.000Z" />
            <Field control={control} name="ministryId" label="Ministry ID" placeholder="Numeric ministry ID" />
            {ministriesQuery.data?.length ? (
              <ThemedText type="small">
                Available ministries: {ministriesQuery.data.map((item: any) => `${item.id}=${item.name}`).join(', ')}
              </ThemedText>
            ) : null}
            <BrandButton label="Save Changes" onPress={handleSubmit(onSubmit)} variant="secondary" />
            {updateMutation.isError ? (
              <ThemedText style={styles.errorText}>{getApiErrorMessage(updateMutation.error, 'Failed to update sermon.')}</ThemedText>
            ) : null}
          </>
        )}
      </BrandCard>
    </BrandScreen>
  );
}

function Field({ control, name, label, placeholder, multiline = false }: { control: any; name: keyof SermonFormValues; label: string; placeholder: string; multiline?: boolean }) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline={multiline}
            style={[styles.input, multiline && styles.multiline, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  errorText: { color: '#B91C1C' },
});
