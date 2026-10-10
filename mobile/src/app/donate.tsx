import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { ChoiceField, FormTextField, IconButton, Screen, ScreenHeader, SignInPrompt } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import { useInitializeDonationPayment, useVerifyDonationPayment } from '@/hooks/use-api';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

const donationSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Enter an amount greater than 0'),
  donationType: z.enum(['tithe', 'offering', 'ministry', 'emergency', 'general']),
  paymentMethod: z.enum(['bank_transfer', 'momo', 'card', 'cash']),
  notes: z.string().optional(),
});

type DonationFormValues = z.infer<typeof donationSchema>;
type DonationFormInput = z.input<typeof donationSchema>;

const DONATION_TYPES: { value: DonationFormValues['donationType']; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'tithe', label: 'Tithe' },
  { value: 'offering', label: 'Offering' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'emergency', label: 'Emergency' },
];

const PAYMENT_METHODS: { value: DonationFormValues['paymentMethod']; label: string }[] = [
  { value: 'card', label: 'Card' },
  { value: 'momo', label: 'Mobile money' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
];

export default function DonateScreen() {
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
      <Screen>
        <ScreenHeader title="Give" subtitle="Support the mission securely" />
        <SignInPrompt
          icon="heart-outline"
          title="Sign in before you give"
          message="Your giving history, payment checks and receipts stay linked to your ANT PRESS account."
          label="Go to sign in"
          onSignIn={() => router.push('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Give"
        subtitle="Support the mission from your phone"
        right={<IconButton icon="receipt-outline" accessibilityLabel="Donation history" onPress={() => router.push('/donations')} />}
      />

      {incomingReference ? (
        <AppCard>
          <AppBadge tone={verifyDonationMutation.isSuccess ? 'success' : 'neutral'}>
            {verifyDonationMutation.isSuccess ? 'Donation verified' : 'Donation return'}
          </AppBadge>
          <AppText variant="small">
            {verifyDonationMutation.isPending
              ? `Verifying donation reference ${incomingReference}...`
              : verifyDonationMutation.isSuccess
                ? `Status: ${verifyDonationMutation.data?.donation?.status || 'completed'}`
                : 'We received the return reference and will confirm the payment status.'}
          </AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="section">Start a donation</AppText>
        <AppText variant="small" tone="muted">
          Choose an amount, giving type and payment method to continue.
        </AppText>

        <View style={styles.amountRow}>
          {[25, 50, 100].map((amount) => (
            <View key={amount} style={styles.amount}>
              <AppButton
                label={formatCedis(amount, 0)}
                variant="secondary"
                size="sm"
                onPress={() => {
                  const currentValues = control._formValues as DonationFormInput;
                  control._reset({
                    ...currentValues,
                    amount,
                  });
                }}
              />
            </View>
          ))}
        </View>

        <FormTextField
          control={control}
          name="amount"
          label="Amount"
          placeholder="Amount"
          keyboardType="decimal-pad"
          error={errors.amount?.message}
        />
        <Controller
          control={control}
          name="donationType"
          render={({ field: { value, onChange } }) => (
            <ChoiceField
              label="Giving type"
              options={DONATION_TYPES}
              value={value}
              onChange={onChange}
              error={errors.donationType?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { value, onChange } }) => (
            <ChoiceField
              label="Payment method"
              options={PAYMENT_METHODS}
              value={value}
              onChange={onChange}
              error={errors.paymentMethod?.message}
            />
          )}
        />
        <FormTextField
          control={control}
          name="notes"
          label="Notes"
          placeholder="Optional note"
          multiline
          error={errors.notes?.message}
        />

        <AppButton label="Start donation" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountRow: { flexDirection: 'row', gap: Space.sm },
  amount: { flex: 1 },
});
