import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

import { BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
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
    const callbackUrl = Linking.createURL('/donate');
    const result = await donationMutation.mutateAsync({
      ...values,
      callbackUrl,
    });
    const authUrl =
      result?.payment?.authorization_url || result?.payment?.authorizationUrl || result?.payment?.url;

    if (authUrl) {
      await Linking.openURL(authUrl);
    }
  };

  if (!user) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Support"
          title="Give securely"
          description="Sign in first so your donations stay connected to your ANT PRESS account."
        />
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Support The Mission"
        title="Give on mobile"
        description="Use the same ANT PRESS giving flow from the website, shaped for mobile checkout."
      />

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
