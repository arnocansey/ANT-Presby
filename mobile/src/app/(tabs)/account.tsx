import React from 'react';
import { router } from 'expo-router';

import {
  BrandButton,
  BrandCard,
  BrandHero,
  BrandPill,
  BrandScreen,
} from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import {
  useMyDonations,
  useMyNotifications,
  useMyPrayerRequests,
  useMyProfile,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function AccountScreen() {
  const { user, isHydrated, clearSession } = useAuthStore();
  const profileQuery = useMyProfile(Boolean(user));
  const donationsQuery = useMyDonations(Boolean(user));
  const prayersQuery = useMyPrayerRequests(Boolean(user));
  const notificationsQuery = useMyNotifications(Boolean(user));

  const handleLogout = async () => {
    await clearSession();
  };

  const displayName = [
    profileQuery.data?.first_name || profileQuery.data?.firstName,
    profileQuery.data?.last_name || profileQuery.data?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Account"
        title={user ? displayName || 'Your ANT PRESS account' : 'Mobile account access'}
        description={
          user
            ? isHydrated
              ? `Signed in as ${user.email}`
              : 'Hydrating your account session...'
            : 'Sign in to access your dashboard, giving, prayer requests, and notifications.'
        }
      />

      {user ? (
        <>
          <BrandCard>
            <BrandPill>Member Snapshot</BrandPill>
            <ThemedText type="small">Profile ready: {profileQuery.isLoading ? 'Loading...' : 'Yes'}</ThemedText>
            <ThemedText type="small">Donations: {donationsQuery.data?.length ?? 0}</ThemedText>
            <ThemedText type="small">Prayer requests: {prayersQuery.data?.length ?? 0}</ThemedText>
            <ThemedText type="small">Unread notifications: {notificationsQuery.data?.unread_count ?? 0}</ThemedText>
          </BrandCard>

          <BrandCard>
            <ThemedText type="defaultSemiBold">Quick actions</ThemedText>
              <BrandButton label="Open Dashboard" onPress={() => router.push('/dashboard')} variant="secondary" />
              <BrandButton label="Edit Profile" onPress={() => router.push('/profile')} variant="outline" />
              <BrandButton label="Make A Donation" onPress={() => router.push('/donate')} variant="outline" />
              <BrandButton label="Donation History" onPress={() => router.push('/donations')} variant="outline" />
              <BrandButton label="Prayer Requests" onPress={() => router.push('/prayers')} variant="outline" />
              <BrandButton label="Notifications" onPress={() => router.push('/notifications')} variant="outline" />
            <BrandButton label="Sign Out" onPress={handleLogout} />
          </BrandCard>
        </>
      ) : (
        <BrandCard>
          <ThemedText type="defaultSemiBold">Get started</ThemedText>
          <ThemedText type="small">
            Use the same ANT PRESS credentials you use on the website.
          </ThemedText>
          <BrandButton label="Go To Sign In" onPress={() => router.push('/login')} variant="secondary" />
        </BrandCard>
      )}
    </BrandScreen>
  );
}
