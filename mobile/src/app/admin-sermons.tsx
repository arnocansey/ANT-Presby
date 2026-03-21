import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  getApiErrorMessage,
  useAdminSermons,
  useCreateAdminSermon,
  useDeleteAdminSermon,
  useMinistries,
} from '@/hooks/use-api';
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
      <BrandScreen>
        <BrandHero
          eyebrow="Admin Sermons"
          title="Admin access required"
          description="Sign in with an admin account to manage sermons from mobile."
        />
      </BrandScreen>
    );
  }

  const sermons = sermonsQuery.data || [];
  const ministries = ministriesQuery.data || [];
  const createError = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create sermon.')
    : '';

  return (
    <AdminShell activeTab="/admin-sermons">
      <BrandHero
        eyebrow="Admin Sermons"
        title="Manage sermons on mobile"
        description="Create and remove sermons using the same backend flow as the web admin area."
      />

      <BrandCard>
        <BrandSectionHeader title="Create a sermon" description="Use a ministry ID from the list below when publishing a sermon." />
        <Field control={control} name="title" label="Title" placeholder="Sermon title" />
        <Field control={control} name="speaker" label="Speaker" placeholder="Speaker name" />
        <Field control={control} name="description" label="Description" placeholder="Sermon summary" multiline />
        <Field control={control} name="videoUrl" label="Video URL" placeholder="Optional video link" />
        <Field control={control} name="sermonDate" label="Sermon Date" placeholder="2026-04-20T09:00:00.000Z" />
        <Field control={control} name="ministryId" label="Ministry ID" placeholder="Numeric ministry ID" />
        {ministries.length > 0 ? (
          <ThemedText type="small">
            Available ministries: {ministries.map((item: any) => `${item.id}=${item.name}`).join(', ')}
          </ThemedText>
        ) : null}
        <BrandButton label="Create Sermon" onPress={handleSubmit(onSubmit)} variant="secondary" />
        {createError ? <ThemedText style={styles.errorText}>{createError}</ThemedText> : null}
      </BrandCard>

      <BrandCard>
        <BrandSectionHeader title="Recent sermons" description="Review the latest sermon records and remove outdated ones." />
        {sermonsQuery.isLoading ? (
          <ThemedText type="small">Loading sermons...</ThemedText>
        ) : sermons.length > 0 ? (
          <View style={styles.list}>
            {sermons.slice(0, 8).map((sermon: any) => (
              <View key={String(sermon?.id)} style={styles.item}>
                <BrandPill>{sermon?.speaker || 'Sermon'}</BrandPill>
                <ThemedText type="defaultSemiBold">{sermon?.title || 'Untitled sermon'}</ThemedText>
                <ThemedText type="small">{sermon?.description || 'No description available.'}</ThemedText>
                <BrandButton
                  label="Edit Sermon"
                  onPress={() => router.push(`/admin-sermons/${sermon?.id}` as never)}
                  variant="secondary"
                />
                <BrandButton label="Delete Sermon" onPress={() => deleteMutation.mutate(Number(sermon?.id))} variant="outline" />
              </View>
            ))}
          </View>
        ) : (
          <ThemedText type="small">No sermons available.</ThemedText>
        )}
      </BrandCard>
    </AdminShell>
  );
}

function Field({
  control,
  name,
  label,
  placeholder,
  multiline = false,
}: {
  control: any;
  name: keyof SermonFormValues;
  label: string;
  placeholder: string;
  multiline?: boolean;
}) {
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
            style={[
              styles.input,
              multiline && styles.multiline,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  list: {
    gap: Spacing.two,
  },
  item: {
    gap: Spacing.one,
  },
  errorText: {
    color: '#B91C1C',
  },
});
