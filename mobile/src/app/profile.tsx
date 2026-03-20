import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useMyProfile, useUpdateProfile } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useMyProfile(Boolean(user));
  const updateProfileMutation = useUpdateProfile();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  React.useEffect(() => {
    if (data) {
      reset({
        firstName: data.first_name || data.firstName || '',
        lastName: data.last_name || data.lastName || '',
        phone: data.phone || '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfileMutation.mutateAsync(values);
    router.back();
  };

  if (!user) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Profile"
          title="Sign in required"
          description="You need to sign in before managing your ANT PRESS member profile."
        >
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandHero>
      </BrandScreen>
    );
  }

  const displayName = [data?.first_name || data?.firstName, data?.last_name || data?.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Profile"
        title={displayName || 'Member profile'}
        description="Keep your account details aligned with the same ANT PRESS profile used on the website."
      >
        <BrandPill>{data?.email || user.email}</BrandPill>
      </BrandHero>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Profile details</ThemedText>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            <FormField control={control} name="firstName" label="First name" placeholder="First name" error={errors.firstName?.message} />
            <FormField control={control} name="lastName" label="Last name" placeholder="Last name" error={errors.lastName?.message} />
            <FormField
              control={control}
              name="phone"
              label="Phone"
              placeholder="Phone number"
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />

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
                  <ThemedText style={[styles.buttonText, { color: theme.white }]}>
                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                  </ThemedText>
                </View>
              )}
            </Pressable>

            {updateProfileMutation.isError ? (
              <ThemedText style={styles.errorText}>
                Could not save your profile right now.
              </ThemedText>
            ) : null}
          </>
        )}
      </BrandCard>
    </BrandScreen>
  );
}

function FormField({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  error,
}: {
  control: any;
  name: keyof ProfileFormValues;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  error?: string;
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
            keyboardType={keyboardType || 'default'}
            onBlur={onBlur}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
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
  errorText: {
    color: '#B91C1C',
  },
});
