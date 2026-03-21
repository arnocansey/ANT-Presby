import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { z } from 'zod';

import { BrandButton, BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useMyDonations, useMyProfile, useUpdateProfile } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const { data, isLoading } = useMyProfile(Boolean(user));
  const donationsQuery = useMyDonations(Boolean(user));
  const updateProfileMutation = useUpdateProfile();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  React.useEffect(() => {
    if (data) {
      reset({
        firstName: data.first_name || data.firstName || '',
        lastName: data.last_name || data.lastName || '',
        phone: data.phone || '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfileMutation.mutateAsync(values);
  };

  if (!user) {
    return (
      <BrandScreen>
        <BrandCard>
          <ThemedText type="subtitle">Sign in required</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            You need to sign in before managing your ANT PRESS member profile.
          </ThemedText>
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandCard>
      </BrandScreen>
    );
  }

  const displayName = [data?.first_name || data?.firstName, data?.last_name || data?.lastName]
    .filter(Boolean)
    .join(' ');
  const initials = (displayName || user.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const donations = donationsQuery.data ?? [];

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <ThemedText type="subtitle" style={styles.centerTitle}>
          My Profile
        </ThemedText>
        <Pressable
          onPress={() => setShowSignOutConfirm(true)}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="log-out-outline" size={16} color="#F87171" />
        </Pressable>
      </View>

      <View style={[styles.profileCard, { backgroundColor: '#1A1F38', borderColor: 'rgba(255,255,255,0.1)' }]}>
        <View style={[styles.avatar, { backgroundColor: theme.tint }]}>
          <ThemedText type="title" style={styles.whiteText}>
            {initials}
          </ThemedText>
        </View>
        <ThemedText type="subtitle" style={styles.centerText}>
          {displayName || 'Member profile'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {data?.email || user.email}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          Member since {new Date().getFullYear()}
        </ThemedText>
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: 'rgba(245,158,11,0.18)' }]}>
            <ThemedText type="smallBold" style={{ color: '#FBBF24' }}>
              {user.role === 'admin' ? 'Admin' : 'Member'}
            </ThemedText>
          </View>
          <View style={[styles.badge, { backgroundColor: 'rgba(59,130,246,0.18)' }]}>
            <ThemedText type="smallBold" style={{ color: '#60A5FA' }}>
              ANT PRESS
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatCard label="Donations" value={String(donations.length)} color="#10B981" icon="gift-outline" />
        <StatCard label="Profile" value="Live" color="#A855F7" icon="person-outline" />
        <StatCard label="Account" value="1" color="#3B82F6" icon="shield-checkmark-outline" />
      </View>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Profile details</ThemedText>
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            <FormField control={control} name="firstName" label="First name" placeholder="First name" error={errors.firstName?.message} />
            <FormField control={control} name="lastName" label="Last name" placeholder="Last name" error={errors.lastName?.message} />
            <FormField
              control={control}
              name="phone"
              label="Phone"
              placeholder="Phone number"
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />
            <BrandButton
              label={isSubmitting ? 'Saving...' : 'Save Profile'}
              onPress={handleSubmit(onSubmit)}
              variant="secondary"
            />
            {updateProfileMutation.isError ? (
              <ThemedText style={styles.errorText}>Could not save your profile right now.</ThemedText>
            ) : null}
          </>
        )}
      </BrandCard>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Quick actions</ThemedText>
        <BrandButton label="Open Notifications" onPress={() => router.push('/notifications')} variant="outline" />
        <BrandButton label="View Donation History" onPress={() => router.push('/donations')} variant="outline" />
      </BrandCard>

      <Modal visible={showSignOutConfirm} transparent animationType="fade" onRequestClose={() => setShowSignOutConfirm(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: '#151826', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <ThemedText type="subtitle" style={styles.centerText}>
              Sign out?
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
              You will need to sign in again to access your member tools.
            </ThemedText>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowSignOutConfirm(false)} style={[styles.modalButton, styles.modalCancel]}>
                <ThemedText type="defaultSemiBold">Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setShowSignOutConfirm(false);
                  await clearSession();
                  router.replace('/login');
                }}
                style={[styles.modalButton, { backgroundColor: '#F87171' }]}>
                <ThemedText type="defaultSemiBold" style={styles.whiteText}>
                  Sign Out
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </BrandScreen>
  );
}

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <View style={[styles.statCard, { borderColor: `${color}22`, backgroundColor: `${color}12` }]}>
      <Ionicons name={icon} size={16} color={color} />
      <ThemedText type="defaultSemiBold" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
        {label}
      </ThemedText>
    </View>
  );
}

function FormField({
  control,
  name,
  label,
  placeholder,
  keyboardType,
  error,
}: {
  control: any;
  name: keyof ProfileFormValues;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad';
  error?: string;
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
            keyboardType={keyboardType || 'default'}
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
          />
        )}
      />
      {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  centerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  centerText: {
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    alignItems: 'center',
    gap: 6,
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
  errorText: {
    color: '#FCA5A5',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancel: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
});
