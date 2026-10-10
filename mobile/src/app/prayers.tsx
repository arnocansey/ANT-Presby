import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import {
  ChoiceField,
  FormMessage,
  FormTextField,
  LoadingList,
  Screen,
  ScreenHeader,
  SignInPrompt,
  StatGrid,
  StatTile,
  SwitchRow,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import { useCreatePrayerRequest, useMyPrayerRequests } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const prayerSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  category: z.enum(['personal', 'family', 'health', 'work', 'financial', 'other']),
  isAnonymous: z.boolean().default(false),
  shareOnWall: z.boolean().default(false),
});

type PrayerFormValues = z.infer<typeof prayerSchema>;
type PrayerFormInput = z.input<typeof prayerSchema>;

const categories: PrayerFormValues['category'][] = ['personal', 'family', 'health', 'work', 'financial', 'other'];
const categoryOptions = categories.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));

export default function PrayerScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const createPrayerMutation = useCreatePrayerRequest();
  const { data, isLoading } = useMyPrayerRequests(Boolean(user));
  const requests = Array.isArray(data) ? data : [];
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrayerFormInput, unknown, PrayerFormValues>({
    resolver: zodResolver(prayerSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      isAnonymous: false,
      shareOnWall: false,
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (values: PrayerFormValues) => {
    await createPrayerMutation.mutateAsync(values);
    reset({
      title: '',
      description: '',
      category: 'personal',
      isAnonymous: false,
      shareOnWall: false,
    });
  };

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="Prayer requests" />
        <SignInPrompt
          icon="heart-outline"
          title="Sign in first"
          message="Prayer requests are personal to your account, so mobile requests start after sign-in."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back title="Prayer requests" subtitle="Share a request and follow the ones you have sent" />

      <StatGrid>
        <StatTile label="Requests" value={requests.length} icon="heart-outline" />
        <StatTile label="On the wall" value={requests.filter((item: any) => item?.share_on_wall).length} icon="people-outline" />
      </StatGrid>

      <AppCard>
        <AppText variant="section">New request</AppText>

        <FormTextField control={control} name="title" label="Title" placeholder="Prayer request title" error={errors.title?.message} />
        <FormTextField
          control={control}
          name="description"
          label="Description"
          placeholder="Share what you would like prayer for"
          multiline
          error={errors.description?.message}
        />

        <ChoiceField
          label="Category"
          options={categoryOptions}
          value={selectedCategory}
          onChange={(category) => setValue('category', category)}
        />

        <Controller
          control={control}
          name="isAnonymous"
          render={({ field: { onChange, value } }) => (
            <SwitchRow
              label="Submit anonymously"
              description="Your name can be hidden while the request still belongs to your account."
              value={Boolean(value)}
              onValueChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="shareOnWall"
          render={({ field: { onChange, value } }) => (
            <SwitchRow
              label="Share on the prayer wall"
              description="After approval, other signed-in members can see this request and pray for you."
              value={Boolean(value)}
              onValueChange={onChange}
            />
          )}
        />

        <AppButton label="Submit request" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />

        {createPrayerMutation.isError ? (
          <FormMessage tone="danger">Could not submit your prayer request right now.</FormMessage>
        ) : null}
      </AppCard>

      <AppCard>
        <AppText variant="section">Your requests</AppText>
        {isLoading ? (
          <LoadingList count={2} height={72} />
        ) : requests.length === 0 ? (
          <AppText variant="small" tone="muted">
            No prayer requests yet.
          </AppText>
        ) : (
          requests.map((item: any) => (
            <View key={item.id} style={[styles.request, { borderTopColor: colors.border }]}>
              <AppBadge>{String(item.category)}</AppBadge>
              <AppText variant="bodyStrong">{item.title}</AppText>
              <AppText variant="small">{item.description}</AppText>
              <AppText variant="small" tone="muted">
                {`${item.status} - ${item.is_anonymous ? 'Anonymous' : 'Named'}`}
              </AppText>
            </View>
          ))
        )}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  request: { gap: Space.xs, paddingTop: Space.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
