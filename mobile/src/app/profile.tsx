import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { z } from 'zod';

import {
  Avatar,
  ConfirmDialog,
  FormMessage,
  FormTextField,
  IconButton,
  ListGroup,
  ListRow,
  ErrorState,
  LoadingList,
  Screen,
  ScreenHeader,
  SignInPrompt,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { useMyDonations, useMyProfile, useUpdateProfile } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const { data, isLoading, isError, refetch } = useMyProfile(Boolean(user));
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
      <Screen>
        <ScreenHeader back title="My profile" />
        <SignInPrompt
          title="Sign in required"
          message="You need to sign in before managing your ANT PRESS member profile."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
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
    <Screen>
      <ScreenHeader
        back
        title="My profile"
        right={<IconButton icon="log-out-outline" variant="danger" accessibilityLabel="Sign out" onPress={() => setShowSignOutConfirm(true)} />}
      />

      <AppCard style={styles.identity}>
        <Avatar initials={initials} size={80} />
        <AppText variant="section" style={styles.center}>
          {displayName || 'Member profile'}
        </AppText>
        <AppText variant="small" tone="muted" style={styles.center}>
          {data?.email || user.email}
        </AppText>
        <AppBadge tone={user.role === 'admin' ? 'gold' : 'neutral'}>{user.role === 'admin' ? 'Admin' : 'Member'}</AppBadge>
      </AppCard>

      <AppCard>
        <AppText variant="section">Profile details</AppText>
        {isLoading ? (
          <LoadingList count={3} height={44} />
        ) : isError && !data ? (
          // Never show an empty form after a failed load: the member would think their details were gone.
          <ErrorState title="Could not load your profile" onRetry={() => refetch()} />
        ) : (
          <>
            <FormTextField control={control} name="firstName" label="First name" placeholder="First name" error={errors.firstName?.message} />
            <FormTextField control={control} name="lastName" label="Last name" placeholder="Last name" error={errors.lastName?.message} />
            <FormTextField
              control={control}
              name="phone"
              label="Phone"
              placeholder="Phone number"
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />
            <AppButton label={isSubmitting ? 'Saving...' : 'Save profile'} loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
            {updateProfileMutation.isError ? <FormMessage tone="danger">Could not save your profile right now.</FormMessage> : null}
          </>
        )}
      </AppCard>

      <ListGroup>
        <ListRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        <ListRow
          icon="receipt-outline"
          label="Donation history"
          value={String(donations.length)}
          onPress={() => router.push('/donations')}
        />
      </ListGroup>

      <ConfirmDialog
        visible={showSignOutConfirm}
        icon="log-out-outline"
        destructive
        title="Sign out?"
        message="You will need to sign in again to access your member tools."
        confirmLabel="Sign out"
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={async () => {
          setShowSignOutConfirm(false);
          await clearSession();
          router.replace('/login');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
