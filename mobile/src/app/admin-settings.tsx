import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandHero, BrandMetric, BrandPill, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAdminSettings, useUpdateAdminSettings } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
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
  const theme = useTheme();
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
      <BrandScreen>
        <BrandHero
          eyebrow="Admin Settings"
          title="Admin access required"
          description="Sign in with an admin account to manage platform settings from mobile."
        />
      </BrandScreen>
    );
  }

  const statusMessage = updateMutation.isSuccess
    ? 'Settings saved successfully.'
    : updateMutation.isError
      ? getApiErrorMessage(updateMutation.error, 'Failed to save settings.')
      : '';

  return (
    <AdminShell activeTab="/admin-settings">
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Settings</ThemedText>
        </View>
        <View style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="settings-outline" size={16} color={theme.text} />
        </View>
      </View>

      <BrandCard>
        <BrandMetric label="Config" value="Live" />
        <BrandMetric label="Mode" value="Admin" />
      </BrandCard>

      <BrandCard>
        <BrandPill>Settings</BrandPill>
        <BrandSectionHeader title="Site configuration" description="Edit the title, contact email, payment key, and donation success message." />
        {settingsQuery.isLoading ? (
          <ThemedText type="small">Loading settings...</ThemedText>
        ) : (
          <>
            <Field control={control} name="siteTitle" label="Site Title" placeholder="ANT PRESS" />
            <Field control={control} name="contactEmail" label="Contact Email" placeholder="team@example.com" />
            <Field control={control} name="paymentPublicKey" label="Payment Public Key" placeholder="Public payment key" />
            <Field
              control={control}
              name="donationSuccessMessage"
              label="Donation Success Message"
              placeholder="Thank you for your donation."
              multiline
            />
            <BrandButton label="Save Settings" onPress={handleSubmit(onSubmit)} variant="secondary" />
            {statusMessage ? (
              <ThemedText style={{ color: updateMutation.isSuccess ? '#0369A1' : '#B91C1C' }}>
                {statusMessage}
              </ThemedText>
            ) : null}
          </>
        )}
      </BrandCard>
    </AdminShell>
  );
}

function Field({
  control,
  name,
  label,
  placeholder,
  multiline = false,
}: {
  control: any;
  name: keyof SettingsFormValues;
  label: string;
  placeholder: string;
  multiline?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline={multiline}
            style={[
              styles.input,
              multiline && styles.multiline,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
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
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
