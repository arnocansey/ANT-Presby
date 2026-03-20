import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

import { BrandCard, BrandHero, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLogin } from '@/hooks/use-api';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const theme = useTheme();
  const loginMutation = useLogin();
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
      router.replace('/account');
    } catch {
      // Inline error panel handles feedback.
    }
  };

  return (
    <BrandScreen scroll={false}>
      <BrandHero
        eyebrow="Welcome Back"
        title="Sign in to ANT PRESS"
        description="Use the same ANT PRESS account you already use on the website."
      />

      <BrandCard>
        <Field
          control={control}
          name="email"
          label="Email"
          placeholder="Email address"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email?.message}
        />

        <Field
          control={control}
          name="password"
          label="Password"
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          error={errors.password?.message}
        />

        <Pressable onPress={handleSubmit(onSubmit)}>
          {({ pressed }) => (
            <View
              style={[
                styles.primaryButton,
                {
                  backgroundColor: theme.tint,
                  opacity: pressed || isSubmitting ? 0.88 : 1,
                },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <ThemedText style={[styles.primaryButtonText, { color: theme.white }]}>
                  Sign In
                </ThemedText>
              )}
            </View>
          )}
        </Pressable>

        {loginMutation.isError ? (
          <View style={[styles.errorPanel, { borderColor: '#FCA5A5' }]}>
            <ThemedText style={styles.errorText}>
              Could not sign in. Please confirm your email and password.
            </ThemedText>
          </View>
        ) : null}
      </BrandCard>

      <BrandCard>
        <ThemedText type="small">
          New account creation still lives on the ANT PRESS website for now.
        </ThemedText>
        <Link href="/" asChild>
          <Pressable>
            {({ pressed }) => (
              <ThemedText
                type="smallBold"
                style={[styles.linkText, { color: theme.tint, opacity: pressed ? 0.75 : 1 }]}>
                Back to home
              </ThemedText>
            )}
          </Pressable>
        </Link>
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
  ...rest
}: {
  control: any;
  name: keyof LoginFormValues;
  label: string;
  placeholder: string;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
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
            style={[
              styles.input,
              {
                backgroundColor: theme.background,
                borderColor: error ? '#F87171' : theme.border,
                color: theme.text,
              },
            ]}
            value={value}
            {...rest}
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
  primaryButton: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.medium,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  errorPanel: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: '#B91C1C',
  },
  linkText: {
    marginTop: Spacing.one,
  },
});
