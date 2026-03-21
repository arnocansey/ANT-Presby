import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

import { BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useGoogleLogin, useRegister } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();
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
    <BrandScreen scroll={false}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Ionicons name="chevron-back" size={18} color={theme.textSecondary} />
          </Pressable>
          <View style={styles.progressWrap}>
            <View style={styles.progressMeta}>
              <ThemedText type="small" themeColor="textSecondary">
                Step 1 of 2
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                50%
              </ThemedText>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { backgroundColor: theme.tint }]} />
            </View>
          </View>
        </View>

        <View style={styles.header}>
          <View style={[styles.crossTile, { backgroundColor: theme.tint }]}>
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </View>
          <ThemedText type="title">Join ANT PRESS</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Create your account and keep your giving, events, and member activity connected across web and mobile.
          </ThemedText>
        </View>

        <View style={styles.form}>
          {registeredEmail ? (
            <View style={[styles.successPanel, { borderColor: 'rgba(52,211,153,0.35)', backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <View style={[styles.successIconWrap, { backgroundColor: 'rgba(52,211,153,0.18)' }]}>
                <Ionicons name="mail-open-outline" size={22} color="#6EE7B7" />
              </View>
              <ThemedText type="subtitle">Check your email</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
                We sent a verification link to {registeredEmail}. Open that message and verify your
                account before signing in.
              </ThemedText>
              <Pressable onPress={() => router.replace('/login')}>
                {({ pressed }) => (
                  <View style={[styles.primaryButton, { backgroundColor: theme.tint, opacity: pressed ? 0.88 : 1 }]}>
                    <ThemedText style={[styles.primaryButtonText, { color: theme.white }]}>Go To Sign In</ThemedText>
                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
              <Pressable onPress={() => setRegisteredEmail('')}>
                <ThemedText type="smallBold" style={[styles.centerText, { color: theme.tint }]}>
                  Create another account
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
          <View style={styles.twoCol}>
            <Field control={control} name="firstName" label="First Name" placeholder="John" icon="person-outline" error={errors.firstName?.message} />
            <Field control={control} name="lastName" label="Last Name" placeholder="Doe" icon="person-outline" error={errors.lastName?.message} />
          </View>

          <Field control={control} name="email" label="Email Address" placeholder="you@example.com" icon="mail-outline" keyboardType="email-address" autoCapitalize="none" error={errors.email?.message} />
          <Field control={control} name="phone" label="Phone Number" placeholder="Optional phone number" icon="call-outline" keyboardType="default" autoCapitalize="none" error={errors.phone?.message} />
          <Field
            control={control}
            name="password"
            label="Password"
            placeholder="Min. 8 characters"
            icon="lock-closed-outline"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={errors.password?.message}
            trailing={
              <Pressable onPress={() => setShowPassword((value) => !value)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={theme.textSecondary} />
              </Pressable>
            }
          />

          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field: { value, onChange } }) => (
              <Pressable onPress={() => onChange(!value)} style={styles.termsRow}>
                <View style={[styles.checkbox, value ? { backgroundColor: theme.tint, borderColor: theme.tint } : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.18)' }]}>
                  {value ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.termsText}>
                  I agree to the Terms of Service and Privacy Policy, and consent to receive church communications.
                </ThemedText>
              </Pressable>
            )}
          />
          {errors.acceptedTerms ? <ThemedText style={styles.errorText}>{errors.acceptedTerms.message}</ThemedText> : null}

          <Pressable onPress={handleSubmit(onSubmit)}>
            {({ pressed }) => (
              <View style={[styles.primaryButton, { backgroundColor: theme.tint, opacity: pressed || isSubmitting ? 0.88 : 1 }]}>
                {isSubmitting ? (
                  <ActivityIndicator color={theme.white} />
                ) : (
                  <>
                    <ThemedText style={[styles.primaryButtonText, { color: theme.white }]}>Create Account</ThemedText>
                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </View>
            )}
          </Pressable>

          {registerMutation.isError ? (
            <View style={[styles.errorPanel, { borderColor: '#7F1D1D', backgroundColor: '#2A0E12' }]}>
              <ThemedText style={styles.errorText}>{registerErrorMessage}</ThemedText>
            </View>
          ) : null}

          <Pressable
            onPress={() => googlePromptAsync()}
            disabled={!googleRequest || googleLoginMutation.isPending}
            style={[
              styles.googleButton,
              {
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderColor: 'rgba(255,255,255,0.12)',
                opacity: !googleRequest || googleLoginMutation.isPending ? 0.55 : 1,
              },
            ]}>
            <Ionicons name="logo-google" size={18} color="#FFFFFF" />
            <ThemedText type="defaultSemiBold">
              {googleLoginMutation.isPending ? 'Connecting to Google...' : 'Continue with Google'}
            </ThemedText>
          </Pressable>

          {googleLoginMutation.isError ? (
            <View style={[styles.errorPanel, { borderColor: '#7F1D1D', backgroundColor: '#2A0E12' }]}>
              <ThemedText style={styles.errorText}>{googleErrorMessage}</ThemedText>
            </View>
          ) : null}

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              Already have an account?
            </ThemedText>
            <Pressable onPress={() => router.replace('/login')}>
              <ThemedText type="smallBold" style={{ color: theme.tint }}>
                Sign In
              </ThemedText>
            </Pressable>
          </View>
            </>
          )}
        </View>
      </ScrollView>
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
  name: keyof RegisterFormValues;
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
          <View style={[styles.inputShell, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: error ? '#F87171' : 'rgba(255,255,255,0.12)' }]}>
            <Ionicons name={icon} size={17} color={error ? '#FCA5A5' : theme.textSecondary} />
            <TextInput
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text }]}
              value={value ? String(value) : ''}
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
  scrollContent: {
    gap: Spacing.four,
    paddingBottom: Spacing.seven,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressWrap: {
    flex: 1,
    gap: 6,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '50%',
    height: '100%',
    borderRadius: Radius.pill,
  },
  header: {
    gap: Spacing.two,
  },
  crossTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    gap: Spacing.three,
  },
  successPanel: {
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    alignItems: 'center',
  },
  successIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  twoCol: {
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleButton: {
    minHeight: 54,
    borderRadius: Radius.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
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
  footer: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  centerText: {
    textAlign: 'center',
  },
});
