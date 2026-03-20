import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { z } from 'zod';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useCreatePrayerRequest, useMyPrayerRequests } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const prayerSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  category: z.enum(['personal', 'family', 'health', 'work', 'financial', 'other']),
  isAnonymous: z.boolean().default(false),
});

type PrayerFormValues = z.infer<typeof prayerSchema>;
type PrayerFormInput = z.input<typeof prayerSchema>;

const categories: PrayerFormValues['category'][] = [
  'personal',
  'family',
  'health',
  'work',
  'financial',
  'other',
];

export default function PrayerScreen() {
  const theme = useTheme();
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
    });
  };

  if (!user) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Prayer"
          title="Sign in first"
          description="Prayer requests are personal to your account, so mobile requests start after sign-in."
        >
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandHero>
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Prayer Requests"
        title="Share what matters"
        description="Submit a prayer request and track your recent requests from the same ANT PRESS member space."
      />

      <BrandCard>
        <ThemedText type="defaultSemiBold">New request</ThemedText>

        <Field control={control} name="title" label="Title" placeholder="Prayer request title" error={errors.title?.message} />
        <Field
          control={control}
          name="description"
          label="Description"
          placeholder="Share what you would like prayer for"
          multiline
          error={errors.description?.message}
        />

        <View style={styles.field}>
          <ThemedText type="smallBold">Category</ThemedText>
          <View style={styles.optionWrap}>
            {categories.map((category) => {
              const active = category === selectedCategory;
              return (
                <Pressable key={category} onPress={() => setValue('category', category)}>
                  {({ pressed }) => (
                    <View
                      style={[
                        styles.option,
                        {
                          backgroundColor: active ? theme.tint : theme.background,
                          borderColor: active ? theme.tint : theme.border,
                          opacity: pressed ? 0.88 : 1,
                        },
                      ]}>
                      <ThemedText type="smallBold" style={{ color: active ? theme.white : theme.text }}>
                        {category}
                      </ThemedText>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchCopy}>
            <ThemedText type="smallBold">Submit anonymously</ThemedText>
            <ThemedText type="small">
              Your name can be hidden while the request still belongs to your account.
            </ThemedText>
          </View>
          <Controller
            control={control}
            name="isAnonymous"
            render={({ field: { onChange, value } }) => (
              <Switch
                trackColor={{ false: theme.backgroundSelected, true: theme.tint }}
                thumbColor={theme.white}
                onValueChange={onChange}
                value={value}
              />
            )}
          />
        </View>

        <Pressable onPress={handleSubmit(onSubmit)}>
          {({ pressed }) => (
            <View
              style={[
                styles.button,
                {
                  backgroundColor: theme.tint,
                  opacity: pressed || isSubmitting ? 0.88 : 1,
                },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: theme.white }]}>
                  Submit Request
                </ThemedText>
              )}
            </View>
          )}
        </Pressable>

        {createPrayerMutation.isError ? (
          <ThemedText style={styles.errorText}>
            Could not submit your prayer request right now.
          </ThemedText>
        ) : null}
      </BrandCard>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Your requests</ThemedText>
        {isLoading ? (
          <ActivityIndicator />
        ) : requests.length === 0 ? (
          <ThemedText type="small">No prayer requests yet.</ThemedText>
        ) : (
          requests.map((item: any) => (
            <View key={item.id} style={styles.requestCard}>
              <BrandPill>{item.category}</BrandPill>
              <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
              <ThemedText type="small">{item.description}</ThemedText>
              <ThemedText type="small">{`${item.status} - ${item.is_anonymous ? 'Anonymous' : 'Named'}`}</ThemedText>
            </View>
          ))
        )}
      </BrandCard>
    </BrandScreen>
  );
}

function Field({
  control,
  name,
  label,
  placeholder,
  error,
  multiline,
}: {
  control: any;
  name: keyof PrayerFormInput;
  label: string;
  placeholder: string;
  error?: string;
  multiline?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <TextInput
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline={multiline}
            style={[
              styles.input,
              multiline && styles.textarea,
              {
                backgroundColor: theme.background,
                borderColor: error ? '#F87171' : theme.border,
                color: theme.text,
              },
            ]}
            value={value}
          />
        )}
      />
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
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
  textarea: {
    minHeight: 132,
    textAlignVertical: 'top',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  switchCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  button: {
    minHeight: 52,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  requestCard: {
    gap: Spacing.one,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#CBD5E1',
  },
  errorText: {
    color: '#B91C1C',
  },
});
