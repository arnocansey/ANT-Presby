import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { Link, router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { CheckboxRow, FormMessage, FormTextField, Screen } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { getApiErrorMessage, useGoogleLogin, useLogin } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const [showPassword, setShowPassword] = React.useState(false);
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'token',
  });
  const loginErrorMessage = loginMutation.isError
    ? getApiErrorMessage(loginMutation.error, 'Could not sign in. Please confirm your email and password.')
    : '';
  const googleErrorMessage = googleLoginMutation.isError
    ? getApiErrorMessage(googleLoginMutation.error, 'Google sign-in failed.')
    : '';
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
      const session = await loginMutation.mutateAsync(values);
      router.replace(session.user?.role === 'admin' ? '/admin' : '/account');
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
      <View style={styles.brand}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={34} color={colors.onPrimary} />
        </View>
        <AppText variant="title" accessibilityRole="header" style={styles.center}>
          Welcome back
        </AppText>
        <AppText variant="small" tone="muted" style={styles.center}>
          Sign in to ANT PRESS
        </AppText>
      </View>

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
        name="password"
        label="Password"
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        error={errors.password?.message}
      />
      <CheckboxRow label="Show password" checked={showPassword} onToggle={() => setShowPassword((value) => !value)} />

      <AppButton label="Sign in" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
      {loginMutation.isError ? <FormMessage tone="danger">{loginErrorMessage}</FormMessage> : null}

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <AppText variant="small" tone="muted">
          or continue with
        </AppText>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <AppButton
        label={googleLoginMutation.isPending ? 'Connecting...' : 'Continue with Google'}
        variant="secondary"
        icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
        disabled={!googleRequest || googleLoginMutation.isPending}
        onPress={() => googlePromptAsync()}
      />
      {googleLoginMutation.isError ? <FormMessage tone="danger">{googleErrorMessage}</FormMessage> : null}

      <View style={styles.footer}>
        <AppText variant="small" tone="muted" style={styles.center}>
          Don&apos;t have an account?
        </AppText>
        <AppButton label="Create account" variant="ghost" onPress={() => router.push('/register' as never)} />
        <Link href="/" asChild>
          <Pressable accessibilityRole="link" style={styles.link}>
            <AppText variant="small" tone="link">
              Back to home
            </AppText>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: Space.sm, paddingVertical: Space.lg },
  mark: { width: 72, height: 72, borderRadius: Corner.panel, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  footer: { alignItems: 'center', gap: Space.xs, paddingTop: Space.md },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center' },
});
