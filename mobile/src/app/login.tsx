import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { Link, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

import { BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useGoogleLogin, useLogin } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const theme = useTheme();
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
    <BrandScreen>
      <View style={styles.topGraphic}>
        <View style={[styles.glowRing, styles.ringLarge, { borderColor: 'rgba(255,159,26,0.10)' }]} />
        <View style={[styles.glowRing, styles.ringMedium, { borderColor: 'rgba(255,159,26,0.15)' }]} />
        <View style={[styles.glowRing, styles.ringSmall, { borderColor: 'rgba(255,159,26,0.25)' }]} />
        <View style={[styles.crossTile, { backgroundColor: theme.tint }]}>
          <Ionicons name="add" size={38} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.heading}>
        <ThemedText type="title" style={styles.centerText}>
          Welcome Back
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Sign in to ANT PRESS
        </ThemedText>
      </View>

      <View style={styles.form}>
        <Field
          control={control}
          name="email"
          label="Email Address"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          icon="mail-outline"
          error={errors.email?.message}
        />

        <Field
          control={control}
          name="password"
          label="Password"
          placeholder="Enter your password"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          icon="lock-closed-outline"
          error={errors.password?.message}
          trailing={
            <Pressable onPress={() => setShowPassword((value) => !value)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={theme.textSecondary}
              />
            </Pressable>
          }
        />

        <View style={styles.forgotRow}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Forgot Password?
          </ThemedText>
        </View>

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
                <>
                  <ThemedText style={[styles.primaryButtonText, { color: theme.white }]}>
                    Sign In
                  </ThemedText>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </View>
          )}
        </Pressable>

        {loginMutation.isError ? (
          <View style={[styles.errorPanel, { borderColor: '#7F1D1D', backgroundColor: '#2A0E12' }]}>
            <ThemedText style={styles.errorText}>{loginErrorMessage}</ThemedText>
          </View>
        ) : null}

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <ThemedText type="small" themeColor="textSecondary">
            or continue with
          </ThemedText>
          <View style={styles.divider} />
        </View>

        <View style={styles.socialRow}>
          <Pressable
            onPress={() => googlePromptAsync()}
            disabled={!googleRequest || googleLoginMutation.isPending}
            style={[
              styles.socialButton,
              {
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.12)',
                opacity: !googleRequest || googleLoginMutation.isPending ? 0.55 : 1,
              },
            ]}>
            <Ionicons name="logo-google" size={16} color="#FFFFFF" />
            <ThemedText type="defaultSemiBold">
              {googleLoginMutation.isPending ? 'Connecting...' : 'Google'}
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.socialButton, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)' }]}>
            <Ionicons name="logo-apple" size={16} color="#FFFFFF" />
            <ThemedText type="defaultSemiBold">Apple</ThemedText>
          </Pressable>
        </View>

        {googleLoginMutation.isError ? (
          <View style={[styles.errorPanel, { borderColor: '#7F1D1D', backgroundColor: '#2A0E12' }]}>
            <ThemedText style={styles.errorText}>{googleErrorMessage}</ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Don&apos;t have an account?
        </ThemedText>
        <Pressable onPress={() => router.push('/register' as never)}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Create Account
          </ThemedText>
        </Pressable>
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
      </View>
    </BrandScreen>
  );
}

function Field({
  control,
  name,
  label,
  placeholder,
  error,
  icon,
  trailing,
  ...rest
}: {
  control: any;
  name: keyof LoginFormValues;
  label: string;
  placeholder: string;
  error?: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  trailing?: React.ReactNode;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.fieldLabel}>
        {label}
      </ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onBlur, onChange, value } }) => (
          <View
            style={[
              styles.inputShell,
              {
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderColor: error ? '#F87171' : 'rgba(255,255,255,0.12)',
              },
            ]}>
            <Ionicons name={icon} size={17} color={error ? '#FCA5A5' : theme.textSecondary} />
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              value={value}
              {...rest}
            />
            {trailing}
          </View>
        )}
      />
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topGraphic: {
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: Radius.pill,
  },
  ringLarge: {
    width: 224,
    height: 224,
  },
  ringMedium: {
    width: 160,
    height: 160,
  },
  ringSmall: {
    width: 112,
    height: 112,
  },
  crossTile: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    gap: Spacing.one,
    marginBottom: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  field: {
    gap: Spacing.one,
  },
  fieldLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputShell: {
    minHeight: 54,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.three,
  },
  forgotRow: {
    alignItems: 'flex-end',
    marginTop: -4,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  errorPanel: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  errorText: {
    color: '#FCA5A5',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  socialRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  socialButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  footer: {
    marginTop: 'auto',
    gap: Spacing.two,
    paddingTop: Spacing.four,
  },
  linkText: {
    textAlign: 'center',
  },
});
