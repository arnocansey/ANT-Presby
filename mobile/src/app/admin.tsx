import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import {
  Avatar,
  type IconName,
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
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  useAdminDashboardOverview,
  useAdminDonations,
  useAdminPrayerRequests,
  useAdminRecentActivities,
} from '@/hooks/use-api';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

// The same twelve shortcuts as before, grouped like the web admin sidebar (spec §3.3).
const ACTION_GROUPS: { title: string; items: { icon: IconName; label: string; href: string }[] }[] = [
  {
    title: 'Content',
    items: [
      { icon: 'cloud-upload-outline', label: 'Upload sermon', href: '/admin-sermons' },
      { icon: 'albums-outline', label: 'Series', href: '/admin-series' },
      { icon: 'book-outline', label: 'Devotionals', href: '/admin-devotionals' },
      { icon: 'images-outline', label: 'Gallery', href: '/admin-gallery' },
      { icon: 'megaphone-outline', label: 'Announcement', href: '/admin-announcements' },
      { icon: 'radio-outline', label: 'Livestream', href: '/admin-live' },
    ],
  },
  {
    title: 'Church life',
    items: [
      { icon: 'add-circle-outline', label: 'New event', href: '/admin-events' },
      { icon: 'checkmark-done-outline', label: 'Attendance', href: '/admin-attendance' },
    ],
  },
  {
    title: 'People and giving',
    items: [
      { icon: 'person-add-outline', label: 'Add member', href: '/admin-users' },
      { icon: 'cash-outline', label: 'View giving', href: '/admin-donations' },
    ],
  },
  {
    title: 'Overview and settings',
    items: [
      { icon: 'bar-chart-outline', label: 'Analytics', href: '/admin-analytics' },
      { icon: 'settings-outline', label: 'Settings', href: '/admin-settings' },
    ],
  },
];

export default function AdminScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const overviewQuery = useAdminDashboardOverview(isAdmin);
  const activitiesQuery = useAdminRecentActivities(isAdmin);
  const donationsQuery = useAdminDonations(isAdmin);
  const prayersQuery = useAdminPrayerRequests(isAdmin);

  if (!user) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Admin panel" title="Dashboard" />
        <SignInPrompt
          icon="shield-outline"
          title="Sign in required"
          message="Sign in with your ANT PRESS admin account to manage the platform from mobile."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Admin panel" title="Dashboard" />
        <EmptyState
          icon="lock-closed-outline"
          title="Restricted access"
          message="This mobile console is available only to admin accounts."
          action={<AppButton label="Back to account" onPress={() => router.replace('/account')} />}
        />
      </Screen>
    );
  }

  const overview = overviewQuery.data;
  const activities = activitiesQuery.data || [];
  const donations = donationsQuery.data || [];
  const prayers = prayersQuery.data || [];
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const initials = (displayName || user.email || 'A')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const totalUsers = toFiniteNumber(overview?.users?.total);
  const totalRevenue = toFiniteNumber(overview?.donations?.total_amount);
  const totalSermons = toFiniteNumber(overview?.content?.sermons);
  const totalEvents = toFiniteNumber(overview?.events?.total);
  const pendingPrayerRequests = toFiniteNumber(overview?.prayers?.pending_count);

  const pendingItems = [
    { label: 'Pending donations', count: donations.filter((item: any) => ['pending', 'processing'].includes(String(item?.status || '').toLowerCase())).length, status: 'warning' as const },
    { label: 'Unread prayer requests', count: pendingPrayerRequests || prayers.filter((item: any) => String(item?.status || '').toLowerCase() === 'pending').length, status: 'alert' as const },
    { label: 'Recent audit activity', count: activities.length, status: 'info' as const },
    { label: 'Published events', count: totalEvents, status: 'info' as const },
  ];

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader eyebrow="Admin panel" title="Dashboard" />

      <AppCard style={styles.account}>
        <Avatar initials={initials} tone="gold" size={44} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {displayName || user.email || 'Admin account'}
          </AppText>
          <AppText variant="small" tone="muted">
            {`${String(user.role || 'admin').replace(/^\w/, (m) => m.toUpperCase())} • ANT PRESS`}
          </AppText>
        </View>
        <AppButton label="Sign out" variant="ghost" size="sm" onPress={() => useAuthStore.getState().clearSession()} />
      </AppCard>

      <SectionHeader title="Overview" />
      <StatGrid>
        <StatTile label="Total members" value={formatMetric(totalUsers)} icon="people-outline" />
        <StatTile label="Monthly giving" value={formatCurrency(totalRevenue)} icon="cash-outline" />
        <StatTile label="Sermons" value={formatMetric(totalSermons)} icon="book-outline" />
        <StatTile label="Events" value={formatMetric(totalEvents)} icon="calendar-outline" />
      </StatGrid>

      <SectionHeader title="Needs attention" />
      <ListGroup>
        {pendingItems.map((item) => (
          <ListRow
            key={item.label}
            label={item.label}
            trailing={
              <AppBadge tone={item.status === 'alert' ? 'danger' : item.status === 'warning' ? 'warning' : 'neutral'}>
                {String(item.count)}
              </AppBadge>
            }
          />
        ))}
      </ListGroup>

      {ACTION_GROUPS.map((group) => (
        <React.Fragment key={group.title}>
          <SectionHeader title={group.title} />
          <ListGroup>
            {group.items.map((item) => (
              <ListRow key={item.label} icon={item.icon} label={item.label} onPress={() => router.push(item.href as never)} />
            ))}
          </ListGroup>
        </React.Fragment>
      ))}

      <SectionHeader title="Recent activity" actionLabel="View all" onAction={() => router.push('/admin-audit' as never)} />
      {activities.length === 0 ? (
        <EmptyState icon="pulse-outline" title="No recent activity yet" />
      ) : (
        <ListGroup>
          {activities.slice(0, 5).map((item: any, index: number) => (
            <ListRow
              key={`${item?.id ?? index}`}
              icon="pulse-outline"
              label={item?.description || item?.message || item?.action || 'Platform activity'}
              description={formatWhen(item?.created_at || item?.createdAt || item?.timestamp)}
            />
          ))}
        </ListGroup>
      )}
    </AdminShell>
  );
}

const formatWhen = (value: unknown) => {
  if (!value) return 'Now';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatMetric = (value: unknown) => {
  const number = toFiniteNumber(value);
  if (number !== null) return number.toLocaleString();
  if (typeof value === 'string' && value.trim()) return value;
  return '0';
};

const formatCurrency = (value: unknown) => {
  return formatCedis(toFiniteNumber(value));
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const styles = StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  flex: { flex: 1, gap: 2 },
});
