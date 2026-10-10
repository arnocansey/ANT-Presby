import React from 'react';
import { useForm } from 'react-hook-form';

import { AdminShell } from '@/components/admin-shell';
import { FormMessage, FormTextField, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { getApiErrorMessage, useAdminSettings, useUpdateAdminSettings } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type SettingsFormValues = {
  siteTitle: string;
  contactEmail: string;
  paymentPublicKey: string;
  donationSuccessMessage: string;
};

export default function AdminSettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const settingsQuery = useAdminSettings(isAdmin);
  const updateMutation = useUpdateAdminSettings();
  const { control, handleSubmit, reset } = useForm<SettingsFormValues>({
    defaultValues: {
      siteTitle: '',
      contactEmail: '',
      paymentPublicKey: '',
      donationSuccessMessage: '',
    },
  });

  React.useEffect(() => {
    if (settingsQuery.data) {
      reset({
        siteTitle: settingsQuery.data.siteTitle || '',
        contactEmail: settingsQuery.data.contactEmail || '',
        paymentPublicKey: settingsQuery.data.paymentPublicKey || '',
        donationSuccessMessage: settingsQuery.data.donationSuccessMessage || '',
      });
    }
  }, [reset, settingsQuery.data]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateMutation.mutateAsync(values);
    } catch {
      // Inline error handles this.
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin settings"
          title="Admin access required"
          subtitle="Sign in with an admin account to manage platform settings from mobile."
        />
      </Screen>
    );
  }

  const statusMessage = updateMutation.isSuccess
    ? 'Settings saved successfully.'
    : updateMutation.isError
      ? getApiErrorMessage(updateMutation.error, 'Failed to save settings.')
      : '';

  return (
    <AdminShell activeTab="/admin-settings">
      <ScreenHeader back eyebrow="Admin" title="Settings" />

      <AppCard>
        <AppText variant="section">Site configuration</AppText>
        <AppText variant="small" tone="muted">
          Edit the title, contact email, payment key, and donation success message.
        </AppText>
        {settingsQuery.isLoading ? (
          <LoadingList count={4} height={44} />
        ) : (
          <>
            <FormTextField control={control} name="siteTitle" label="Site title" placeholder="ANT PRESS" />
            <FormTextField
              control={control}
              name="contactEmail"
              label="Contact email"
              placeholder="team@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormTextField
              control={control}
              name="paymentPublicKey"
              label="Payment public key"
              placeholder="Public payment key"
              autoCapitalize="none"
            />
            <FormTextField
              control={control}
              name="donationSuccessMessage"
              label="Donation success message"
              placeholder="Thank you for your donation."
              multiline
            />
            <AppButton label="Save settings" onPress={handleSubmit(onSubmit)} />
            {statusMessage ? (
              <FormMessage tone={updateMutation.isSuccess ? 'success' : 'danger'}>{statusMessage}</FormMessage>
            ) : null}
          </>
        )}
      </AppCard>
    </AdminShell>
  );
}
