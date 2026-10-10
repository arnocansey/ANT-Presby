import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, ConfirmDialog, type IconName, ListGroup, ListRow, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Corner, Space } from '@/constants/tokens';
import { useGroups, useMyEventRegistrations, useMyNotifications, useMyPrayerRequests, useMyProfile } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

const HELP_LINKS: { label: string; icon: IconName; href: string }[] = [
  { label: 'About ANT PRESS', icon: 'information-circle-outline', href: '/about' },
  { label: 'FAQ', icon: 'help-circle-outline', href: '/faq' },
  { label: 'Contact us', icon: 'mail-outline', href: '/contact' },
  { label: 'Privacy', icon: 'shield-checkmark-outline', href: '/privacy' },
  { label: 'Terms', icon: 'document-text-outline', href: '/terms' },
];

export default function AccountScreen() {
  const { user, clearSession } = useAuthStore();
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const profileQuery = useMyProfile(Boolean(user));
  const notificationsQuery = useMyNotifications(Boolean(user));
  const prayersQuery = useMyPrayerRequests(Boolean(user));
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const groupsQuery = useGroups();

  const displayName = [
    profileQuery.data?.first_name || profileQuery.data?.firstName,
    profileQuery.data?.last_name || profileQuery.data?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  const initials = (displayName || user?.email || 'GP')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const myGroups = (groupsQuery.data ?? []).filter((group) => group.my_status === 'active' || group.my_status === 'pending');
  const registrations = Array.isArray(registrationsQuery.data) ? registrationsQuery.data : [];
  const unread = notificationsQuery.data?.unread_count ?? 0;

  const helpRows = HELP_LINKS.map((link) => (
    <ListRow key={link.href} icon={link.icon} label={link.label} onPress={() => router.push(link.href as never)} />
  ));

  if (!user) {
    return (
      <Screen>
        <ScreenHeader title="Me" subtitle="Your profile, groups and giving" />
        <EmptyState
          icon="person-circle-outline"
          title="Sign in to see your space"
          message="Your profile, prayer requests, groups, registrations and giving live in one ANT PRESS account."
          action={
            <View style={styles.guestActions}>
              <AppButton label="Sign in" onPress={() => router.push('/login')} />
              <AppButton label="Create account" variant="secondary" onPress={() => router.push('/register' as never)} />
            </View>
          }
        />
        <SectionHeader title="Help and information" />
        <ListGroup>{helpRows}</ListGroup>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Me" subtitle="Your profile, groups and giving" />

      <AppCard onPress={() => router.push('/profile')} accessibilityLabel="Edit your profile" style={styles.profile}>
        <Avatar initials={initials} size={56} />
        <View style={styles.profileCopy}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {displayName || user.email}
          </AppText>
          <AppText variant="small" tone="muted" numberOfLines={1}>
            {user.email}
          </AppText>
          <AppBadge tone={user.role === 'admin' ? 'gold' : 'neutral'}>
            {user.role === 'admin' ? 'Admin account' : 'Member account'}
          </AppBadge>
        </View>
        <AppText variant="small" tone="link">
          Edit
        </AppText>
      </AppCard>

      <SectionHeader title="My groups" actionLabel="All groups" onAction={() => router.push('/small-groups' as never)} />
      {groupsQuery.isLoading ? (
        <Skeleton height={64} radius={Corner.card} />
      ) : myGroups.length > 0 ? (
        <ListGroup>
          {myGroups.slice(0, 3).map((group) => (
            <ListRow
              key={group.id}
              icon="people-outline"
              label={group.name}
              description={[group.meeting_day, group.meeting_time].filter(Boolean).join(' · ') || undefined}
              trailing={
                <AppBadge tone={group.my_status === 'active' ? 'success' : 'warning'}>
                  {group.my_status === 'active' ? 'Member' : 'Pending'}
                </AppBadge>
              }
              onPress={() => router.push('/small-groups' as never)}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState
          icon="people-outline"
          title="No groups yet"
          message="Join a small group to grow and pray together during the week."
          action={<AppButton label="Find a group" variant="secondary" onPress={() => router.push('/small-groups' as never)} />}
        />
      )}

      <SectionHeader title="My registrations" actionLabel="Events" onAction={() => router.push('/events')} />
      {registrationsQuery.isLoading ? (
        <Skeleton height={64} radius={Corner.card} />
      ) : registrations.length > 0 ? (
        <ListGroup>
          {registrations.slice(0, 3).map((event: any) => (
            <ListRow
              key={String(event.id)}
              icon="calendar-outline"
              label={event.name || 'Event'}
              description={event.event_date ? new Date(event.event_date).toLocaleDateString() : undefined}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(event.id) } })}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="calendar-outline" title="No registrations" message="Events you register for will show here." />
      )}

      <SectionHeader title="Activity" />
      <ListGroup>
        <ListRow
          icon="notifications-outline"
          label="Notifications"
          trailing={unread > 0 ? <AppBadge tone="danger">{`${unread} new`}</AppBadge> : undefined}
          onPress={() => router.push('/notifications')}
        />
        <ListRow icon="receipt-outline" label="Donation history" onPress={() => router.push('/donations')} />
        <ListRow
          icon="heart-outline"
          label="Prayer requests"
          value={String(prayersQuery.data?.length ?? 0)}
          onPress={() => router.push('/prayers')}
        />
        <ListRow icon="grid-outline" label="My dashboard" onPress={() => router.push('/dashboard')} />
      </ListGroup>

      <SectionHeader title="Settings and help" />
      <ListGroup>
        <ListRow icon="person-outline" label="Edit profile" onPress={() => router.push('/profile')} />
        {helpRows}
      </ListGroup>

      {user.role === 'admin' ? (
        <>
          <SectionHeader title="Admin" />
          <ListGroup>
            <ListRow icon="shield-outline" label="Admin console" onPress={() => router.push('/admin')} />
            <ListRow icon="bar-chart-outline" label="Analytics" onPress={() => router.push('/admin-analytics' as never)} />
            <ListRow icon="megaphone-outline" label="Send announcement" onPress={() => router.push('/admin-announcements' as never)} />
          </ListGroup>
        </>
      ) : null}

      <ListGroup>
        <ListRow icon="log-out-outline" label="Sign out" tone="danger" onPress={() => setShowSignOutConfirm(true)} />
      </ListGroup>

      <ConfirmDialog
        visible={showSignOutConfirm}
        icon="log-out-outline"
        destructive
        title="Sign out?"
        message="You will need to sign in again to access your profile, giving, and prayer history."
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
  guestActions: { alignSelf: 'stretch', gap: Space.sm },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  profileCopy: { flex: 1, gap: Space.xs },
});
