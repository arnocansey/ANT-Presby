import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { CheckboxRow, FormMessage, FormTextField, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import { getApiErrorMessage, useGoogleLogin, useRegister } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  acceptedTerms: z.literal(true, {
    error: () => ({ message: 'You must accept the terms and agreement' }),
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { colors } = useAppTheme();
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();
  const [showPassword, setShowPassword] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState('');
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'token',
  });
  const registerErrorMessage = registerMutation.isError
    ? getApiErrorMessage(registerMutation.error, 'Could not create your account right now.')
    : '';
  const googleErrorMessage = googleLoginMutation.isError
    ? getApiErrorMessage(googleLoginMutation.error, 'Google sign-in failed.')
    : '';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      acceptedTerms: false as true,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const response = await registerMutation.mutateAsync(values);
      setRegisteredEmail(response?.data?.email || values.email);
    } catch {
      // Inline error panel handles feedback.
    }
  };

  React.useEffect(() => {
    const handleGoogleResponse = async () => {
      if (googleResponse?.type !== 'success') {
        return;
      }

      const accessToken =
        googleResponse.authentication?.accessToken ||
        (typeof googleResponse.params?.access_token === 'string'
          ? googleResponse.params.access_token
          : '');

      if (!accessToken) {
        return;
      }

      try {
        const session = await googleLoginMutation.mutateAsync(accessToken);
        router.replace(session.user?.role === 'admin' ? '/admin' : '/account');
      } catch {
        // Inline error panel handles feedback.
      }
    };

    handleGoogleResponse();
  }, [googleLoginMutation, googleResponse]);

  return (
    <Screen>
      <ScreenHeader
        back
        title="Join ANT PRESS"
        subtitle="Create your account and keep your giving, events, and member activity connected across web and mobile."
      />

      {registeredEmail ? (
        <AppCard>
          <View style={[styles.successIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="mail-open-outline" size={26} color={colors.success} />
          </View>
          <AppText variant="section" accessibilityRole="header" style={styles.center}>
            Check your email
          </AppText>
          <AppText variant="small" tone="muted" style={styles.center}>
            We sent a verification link to {registeredEmail}. Open that message and verify your account before signing in.
          </AppText>
          <AppButton label="Go to sign in" onPress={() => router.replace('/login')} />
          <AppButton label="Create another account" variant="ghost" onPress={() => setRegisteredEmail('')} />
        </AppCard>
      ) : (
        <>
          <FormTextField control={control} name="firstName" label="First name" placeholder="John" error={errors.firstName?.message} />
          <FormTextField control={control} name="lastName" label="Last name" placeholder="Doe" error={errors.lastName?.message} />
          <FormTextField
            control={control}
            name="email"
            label="Email address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
          <FormTextField
            control={control}
            name="phone"
            label="Phone number"
            placeholder="Optional phone number"
            keyboardType="default"
            autoCapitalize="none"
            error={errors.phone?.message}
          />
          <FormTextField
            control={control}
            name="password"
            label="Password"
            placeholder="Min. 8 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={errors.password?.message}
          />
          <CheckboxRow label="Show password" checked={showPassword} onToggle={() => setShowPassword((value) => !value)} />

          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field: { value, onChange } }) => (
              <CheckboxRow
                label="I agree to the Terms of Service and Privacy Policy, and consent to receive church communications."
                checked={Boolean(value)}
                onToggle={() => onChange(!value)}
              />
            )}
          />
          {errors.acceptedTerms ? (
            <AppText variant="small" tone="danger">
              {errors.acceptedTerms.message}
            </AppText>
          ) : null}

          <AppButton label="Create account" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
          {registerMutation.isError ? <FormMessage tone="danger">{registerErrorMessage}</FormMessage> : null}

          <AppButton
            label={googleLoginMutation.isPending ? 'Connecting to Google...' : 'Continue with Google'}
            variant="secondary"
            icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
            disabled={!googleRequest || googleLoginMutation.isPending}
            onPress={() => googlePromptAsync()}
          />
          {googleLoginMutation.isError ? <FormMessage tone="danger">{googleErrorMessage}</FormMessage> : null}

          <View style={styles.footer}>
            <AppText variant="small" tone="muted">
              Already have an account?
            </AppText>
            <AppButton label="Sign in" variant="ghost" onPress={() => router.replace('/login')} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  successIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  center: { textAlign: 'center' },
  footer: { alignItems: 'center', gap: Space.xs },
});
