import { router } from 'expo-router';
import React from 'react';
import { View, StyleSheet } from 'react-native';

import {
  BrandButton,
  BrandCard,
  BrandHero,
  BrandMetric,
  BrandScreen,
  BrandSectionHeader,
} from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import {
  useMyDonations,
  useMyEventRegistrations,
  useMyNotifications,
  useMyPrayerRequests,
  useMyProfile,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function MemberDashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const profileQuery = useMyProfile(Boolean(user));
  const donationsQuery = useMyDonations(Boolean(user));
  const prayersQuery = useMyPrayerRequests(Boolean(user));
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const notificationsQuery = useMyNotifications(Boolean(user));

  if (!user) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Member Dashboard"
          title="Your connected space"
          description="Sign in to unlock giving history, prayer activity, notifications, and your event registrations."
        >
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandHero>
      </BrandScreen>
    );
  }

  const displayName = [
    profileQuery.data?.first_name || profileQuery.data?.firstName || user.first_name,
    profileQuery.data?.last_name || profileQuery.data?.lastName || user.last_name,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Dashboard"
        title={displayName || 'Member Dashboard'}
        description="Track your profile, giving, prayer requests, notifications, and registrations in one place."
      >
        <View style={styles.heroActions}>
          <BrandButton label="Edit Profile" onPress={() => router.push('/profile')} />
          <BrandButton label="Give Now" onPress={() => router.push('/donate')} variant="outline" />
        </View>
      </BrandHero>

      <View style={styles.metrics}>
        <BrandMetric label="Unread" value={notificationsQuery.data?.unread_count ?? 0} />
        <BrandMetric label="Donations" value={donationsQuery.data?.length ?? 0} />
        <BrandMetric label="Prayers" value={prayersQuery.data?.length ?? 0} />
        <BrandMetric label="Events" value={registrationsQuery.data?.length ?? 0} />
      </View>

      <BrandCard>
        <BrandSectionHeader
          title="Quick actions"
          description="The same key paths from the website, optimized for mobile."
        />
        <View style={styles.actions}>
          <BrandButton label="Open Notifications" onPress={() => router.push('/notifications')} variant="secondary" />
          <BrandButton label="Prayer Requests" onPress={() => router.push('/prayers')} variant="outline" />
          <BrandButton label="Donation History" onPress={() => router.push('/donations')} variant="outline" />
        </View>
      </BrandCard>

      <BrandCard>
        <BrandSectionHeader title="Profile snapshot" description="Current account details from ANT PRESS." />
        <ThemedText type="defaultSemiBold">{displayName || 'Member account'}</ThemedText>
        <ThemedText type="small">{profileQuery.data?.email || user.email}</ThemedText>
        <ThemedText type="small">{profileQuery.data?.phone || 'No phone number saved yet.'}</ThemedText>
      </BrandCard>
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  heroActions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
  },
});
