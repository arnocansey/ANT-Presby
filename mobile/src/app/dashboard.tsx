import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ListGroup,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  SignInPrompt,
  StatGrid,
  StatTile,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
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
      <Screen>
        <ScreenHeader back title="My dashboard" />
        <SignInPrompt
          title="Your connected space"
          message="Sign in to unlock giving history, prayer activity, notifications, and your event registrations."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  const displayName = [
    profileQuery.data?.first_name || profileQuery.data?.firstName || user.first_name,
    profileQuery.data?.last_name || profileQuery.data?.lastName || user.last_name,
  ]
    .filter(Boolean)
    .join(' ');

  const go = (href: string) => () => router.push(href as never);

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Dashboard"
        title={displayName || 'Member dashboard'}
        subtitle="Your profile, giving, prayer requests, notifications and registrations in one place."
      />

      <View style={styles.actions}>
        <View style={styles.action}>
          <AppButton label="Edit profile" variant="secondary" onPress={() => router.push('/profile')} />
        </View>
        <View style={styles.action}>
          <AppButton label="Give now" onPress={() => router.push('/donate')} />
        </View>
      </View>

      <StatGrid>
        <StatTile label="Unread" value={notificationsQuery.data?.unread_count ?? 0} icon="notifications-outline" />
        <StatTile label="Donations" value={donationsQuery.data?.length ?? 0} icon="receipt-outline" />
        <StatTile label="Prayers" value={prayersQuery.data?.length ?? 0} icon="heart-outline" />
        <StatTile label="Events" value={registrationsQuery.data?.length ?? 0} icon="calendar-outline" />
      </StatGrid>

      <SectionHeader title="Quick actions" />
      <ListGroup>
        <ListRow icon="notifications-outline" label="Notifications" onPress={go('/notifications')} />
        <ListRow icon="heart-outline" label="Prayer requests" onPress={go('/prayers')} />
        <ListRow icon="receipt-outline" label="Donation history" onPress={go('/donations')} />
        <ListRow icon="newspaper-outline" label="News and updates" onPress={go('/news')} />
        <ListRow icon="chatbubbles-outline" label="Community feed" onPress={go('/community')} />
        <ListRow icon="play-circle-outline" label="Browse sermons" onPress={go('/sermons')} />
        <ListRow icon="people-outline" label="Small groups" onPress={go('/small-groups')} />
        <ListRow icon="sparkles-outline" label="Explore ministries" onPress={go('/ministries')} />
        <ListRow icon="hand-left-outline" label="Prayer wall" onPress={go('/prayer-wall')} />
        <ListRow icon="book-outline" label="Daily devotional" onPress={go('/daily-devotional')} />
        <ListRow icon="search-outline" label="Search content" onPress={go('/search')} />
      </ListGroup>

      <SectionHeader title="Profile snapshot" />
      <AppCard>
        <AppText variant="bodyStrong">{displayName || 'Member account'}</AppText>
        <AppText variant="small" tone="muted">
          {profileQuery.data?.email || user.email}
        </AppText>
        <AppText variant="small" tone="muted">
          {profileQuery.data?.phone || 'No phone number saved yet.'}
        </AppText>
        <AppBadge tone={user.role === 'admin' ? 'gold' : 'neutral'}>
          {user.role === 'admin' ? 'Admin-enabled account' : 'Faithful member'}
        </AppBadge>
      </AppCard>

      <SectionHeader title="Help and information" />
      <ListGroup>
        <ListRow icon="information-circle-outline" label="About ANT PRESS" onPress={go('/about')} />
        <ListRow icon="help-circle-outline" label="FAQ" onPress={go('/faq')} />
        <ListRow icon="mail-outline" label="Contact the team" onPress={go('/contact')} />
        <ListRow icon="shield-checkmark-outline" label="Privacy" onPress={go('/privacy')} />
        <ListRow icon="document-text-outline" label="Terms" onPress={go('/terms')} />
      </ListGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Space.sm },
  action: { flex: 1 },
});
