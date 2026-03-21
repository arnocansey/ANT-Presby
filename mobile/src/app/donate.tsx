import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

import { BrandCard, BrandMetric, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useInitializeDonationPayment, useVerifyDonationPayment } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const donationSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Enter an amount greater than 0'),
  donationType: z.enum(['tithe', 'offering', 'ministry', 'emergency', 'general']),
  paymentMethod: z.enum(['bank_transfer', 'momo', 'card', 'cash']),
  notes: z.string().optional(),
});

type DonationFormValues = z.infer<typeof donationSchema>;
type DonationFormInput = z.input<typeof donationSchema>;

export default function DonateScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{ reference?: string | string[] }>();
  const donationMutation = useInitializeDonationPayment();
  const verifyDonationMutation = useVerifyDonationPayment();
  const [verifiedReference, setVerifiedReference] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DonationFormInput, unknown, DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 10,
      donationType: 'general',
      paymentMethod: 'card',
      notes: '',
    },
  });

  const incomingReference = Array.isArray(params.reference) ? params.reference[0] : params.reference;

  React.useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  React.useEffect(() => {
    const verify = async () => {
      if (!user || !incomingReference || verifiedReference === incomingReference) return;
      try {
        await verifyDonationMutation.mutateAsync(incomingReference);
      } finally {
        setVerifiedReference(incomingReference);
      }
    };

    void verify();
  }, [incomingReference, user, verifiedReference, verifyDonationMutation]);

  const onSubmit = async (values: DonationFormValues) => {
    const callbackUrl = Linking.createURL('donate');
    const result = await donationMutation.mutateAsync({
      ...values,
      callbackUrl,
    });
    const authUrl =
      result?.payment?.authorization_url || result?.payment?.authorizationUrl || result?.payment?.url;

    if (authUrl) {
      const authResult = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl);

      if (authResult.type === 'success' && authResult.url) {
        const parsed = Linking.parse(authResult.url);
        const returnedReference =
          typeof parsed.queryParams?.reference === 'string'
            ? parsed.queryParams.reference
            : undefined;

        if (returnedReference) {
          router.replace(`/donate?reference=${encodeURIComponent(returnedReference)}` as never);
          return;
        }
      }

      if (authResult.type === 'cancel') {
        return;
      }

      await Linking.openURL(authUrl);
    }
  };

  if (!user) {
    return (
      <BrandScreen>
        <View style={styles.headerBlock}>
          <ThemedText type="title" style={styles.headerTitle}>
            Give
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Support the mission securely
          </ThemedText>
        </View>
        <View style={[styles.heroCard, { backgroundColor: '#2C1E18' }]}>
          <View style={[styles.heroOrb, styles.heroOrbTop, { backgroundColor: 'rgba(245,158,11,0.18)' }]} />
          <View style={[styles.heroOrb, styles.heroOrbBottom, { backgroundColor: 'rgba(124,58,237,0.18)' }]} />
          <ThemedText type="smallBold" style={styles.heroEyebrow}>
            Support
          </ThemedText>
          <ThemedText type="title" style={styles.heroTitle}>
            Give securely
          </ThemedText>
          <ThemedText type="default" style={styles.heroDescription}>
            Sign in first so your donations stay connected to your ANT PRESS account.
          </ThemedText>
        </View>
        <BrandCard>
          <BrandPill>Account required</BrandPill>
          <ThemedText type="defaultSemiBold">Sign in before you give</ThemedText>
          <ThemedText type="small">
            Your giving history, payment verification, and donation receipts all stay linked to your ANT PRESS profile.
          </ThemedText>
          <Pressable onPress={() => router.push('/login')}>
            {({ pressed }) => (
              <View style={[styles.button, { backgroundColor: theme.tint, opacity: pressed ? 0.88 : 1 }]}>
                <ThemedText style={[styles.buttonText, { color: theme.white }]}>Go To Sign In</ThemedText>
              </View>
            )}
          </Pressable>
        </BrandCard>
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <View style={styles.headerBlock}>
        <ThemedText type="title" style={styles.headerTitle}>
          Give
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Support the mission from mobile
        </ThemedText>
      </View>

      <View style={[styles.heroCard, { backgroundColor: '#2C1E18' }]}>
        <View style={[styles.heroOrb, styles.heroOrbTop, { backgroundColor: 'rgba(245,158,11,0.18)' }]} />
        <View style={[styles.heroOrb, styles.heroOrbBottom, { backgroundColor: 'rgba(124,58,237,0.18)' }]} />
        <ThemedText type="smallBold" style={styles.heroEyebrow}>
          Support
        </ThemedText>
        <ThemedText type="title" style={styles.heroTitle}>
          Give securely
        </ThemedText>
        <ThemedText type="default" style={styles.heroDescription}>
          Use the same ANT PRESS giving flow from the website, shaped for mobile checkout.
        </ThemedText>
      </View>

      <View style={styles.metrics}>
        <BrandMetric label="Mode" value="Secure" />
        <BrandMetric label="Account" value="Linked" />
      </View>

      {incomingReference ? (
        <BrandCard>
          <BrandPill>{verifyDonationMutation.isSuccess ? 'Donation verified' : 'Donation return'}</BrandPill>
          <ThemedText type="small">
            {verifyDonationMutation.isPending
              ? `Verifying donation reference ${incomingReference}...`
              : verifyDonationMutation.isSuccess
                ? `Status: ${verifyDonationMutation.data?.donation?.status || 'completed'}`
                : 'We received the return reference and will confirm the payment status.'}
          </ThemedText>
        </BrandCard>
      ) : null}

      <BrandCard>
        <BrandPill>Giving</BrandPill>
        <ThemedText type="defaultSemiBold">Start a donation</ThemedText>
        <ThemedText type="small">Choose an amount, giving type, and payment path to continue.</ThemedText>
        <View style={styles.amountRow}>
          {[25, 50, 100].map((amount) => (
            <Pressable
              key={amount}
              onPress={() => {
                const currentValues = control._formValues as DonationFormInput;
                control._reset({
                  ...currentValues,
                  amount,
                });
              }}
              style={[styles.amountButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
              <ThemedText type="defaultSemiBold">${amount}</ThemedText>
            </Pressable>
          ))}
        </View>
        <Field
          control={control}
          name="amount"
          label="Amount"
          placeholder="Amount"
          keyboardType="decimal-pad"
          error={errors.amount?.message}
        />
        <Field control={control} name="donationType" label="Donation Type" placeholder="general" error={errors.donationType?.message} />
        <Field control={control} name="paymentMethod" label="Payment Method" placeholder="card" error={errors.paymentMethod?.message} />
        <Field control={control} name="notes" label="Notes" placeholder="Optional note" multiline error={errors.notes?.message} />

        <Pressable onPress={handleSubmit(onSubmit)}>
          {({ pressed }) => (
            <View style={[styles.button, { backgroundColor: theme.tint, opacity: pressed || isSubmitting ? 0.88 : 1 }]}>
              {isSubmitting ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <ThemedText style={[styles.buttonText, { color: theme.white }]}>Start Donation</ThemedText>
              )}
            </View>
          )}
        </Pressable>
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
  keyboardType,
}: {
  control: any;
  name: keyof DonationFormInput;
  label: string;
  placeholder: string;
  error?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'decimal-pad';
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
            keyboardType={keyboardType}
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
            value={value ? String(value) : ''}
          />
        )}
      />
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  headerBlock: {
    gap: Spacing.one,
  },
  headerTitle: {
    fontSize: 30,
    lineHeight: 34,
  },
  heroCard: {
    borderRadius: Radius.large,
    padding: Spacing.four,
    overflow: 'hidden',
    gap: Spacing.two,
    position: 'relative',
    minHeight: 200,
  },
  heroOrb: {
    position: 'absolute',
    borderRadius: Radius.pill,
  },
  heroOrbTop: {
    width: 180,
    height: 180,
    top: -30,
    right: -10,
  },
  heroOrbBottom: {
    width: 160,
    height: 160,
    left: -30,
    bottom: -40,
  },
  heroEyebrow: {
    color: '#FACC15',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
  },
  heroDescription: {
    color: '#E5E7EB',
    maxWidth: 260,
  },
  amountRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  amountButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.medium,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  errorText: {
    color: '#B91C1C',
  },
});
