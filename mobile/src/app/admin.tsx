import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  useAdminDashboardOverview,
  useAdminDonations,
  useAdminPrayerRequests,
  useAdminRecentActivities,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const statPalettes = [
  { bg: ['#2563EB', '#1D4ED8'], icon: 'people-outline' as const },
  { bg: ['#059669', '#047857'], icon: 'cash-outline' as const },
  { bg: ['#9333EA', '#7E22CE'], icon: 'book-outline' as const },
  { bg: ['#D97706', '#B45309'], icon: 'calendar-outline' as const },
];

export default function AdminScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const overviewQuery = useAdminDashboardOverview(isAdmin);
  const activitiesQuery = useAdminRecentActivities(isAdmin);
  const donationsQuery = useAdminDonations(isAdmin);
  const prayersQuery = useAdminPrayerRequests(isAdmin);

  if (!user) {
    return (
      <BrandScreen>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.headerTagRow}>
              <Ionicons name="shield-outline" size={14} color={theme.tint} />
              <ThemedText type="smallBold" style={{ color: theme.tint }}>
                Admin Panel
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.headerTitle}>
              Dashboard
            </ThemedText>
          </View>
        </View>
        <View style={[styles.noticeCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
          <ThemedText type="defaultSemiBold">Sign in required</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sign in with your ANT PRESS admin account to manage the platform from mobile.
          </ThemedText>
          <Pressable onPress={() => router.replace('/login')} style={[styles.primaryButton, { backgroundColor: theme.tint }]}>
            <ThemedText type="defaultSemiBold" style={styles.whiteText}>
              Go To Sign In
            </ThemedText>
          </Pressable>
        </View>
      </BrandScreen>
    );
  }

  if (!isAdmin) {
    return (
      <BrandScreen>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.headerTagRow}>
              <Ionicons name="shield-outline" size={14} color={theme.tint} />
              <ThemedText type="smallBold" style={{ color: theme.tint }}>
                Admin Panel
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.headerTitle}>
              Dashboard
            </ThemedText>
          </View>
        </View>
        <View style={[styles.noticeCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
          <ThemedText type="defaultSemiBold">Restricted access</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            This mobile console is available only to admin accounts.
          </ThemedText>
          <Pressable onPress={() => router.replace('/account')} style={[styles.primaryButton, { backgroundColor: theme.tint }]}>
            <ThemedText type="defaultSemiBold" style={styles.whiteText}>
              Back To Account
            </ThemedText>
          </Pressable>
        </View>
      </BrandScreen>
    );
  }

  const overview = overviewQuery.data;
  const activities = activitiesQuery.data || [];
  const donations = donationsQuery.data || [];
  const prayers = prayersQuery.data || [];
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ');

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

  const stats = [
    { label: 'Total Members', value: formatMetric(totalUsers), change: '+12', up: true },
    { label: 'Monthly Giving', value: formatCurrency(totalRevenue), change: '+8.2%', up: true },
    { label: 'Sermon Views', value: formatMetric(totalSermons), change: '+21%', up: true },
    { label: 'Events This Month', value: formatMetric(totalEvents), change: '-2', up: false },
  ];

  return (
    <AdminShell activeTab="/admin">
      <View style={styles.headerRow}>
        <View>
          <View style={styles.headerTagRow}>
            <Ionicons name="shield-outline" size={14} color={theme.tint} />
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              Admin Panel
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.headerTitle}>
            Dashboard
          </ThemedText>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.headerIconShell, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <Ionicons name="notifications-outline" size={16} color={theme.textSecondary} />
            <View style={styles.alertDot}>
              <ThemedText type="smallBold" style={styles.alertDotText}>
                15
              </ThemedText>
            </View>
          </View>
          <View style={[styles.adminAvatar, { backgroundColor: theme.tint }]}>
            <ThemedText type="defaultSemiBold" style={styles.whiteText}>
              A
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.adminBanner, { backgroundColor: '#1A1F35', borderColor: 'rgba(255,255,255,0.1)' }]}>
        <View style={[styles.adminBadge, { backgroundColor: theme.tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.whiteText}>
            PA
          </ThemedText>
        </View>
        <View style={styles.bannerCopy}>
          <ThemedText type="defaultSemiBold">{displayName || user.email || 'Admin account'}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {`${String(user.role || 'admin').replace(/^\w/, (m) => m.toUpperCase())} • ANT PRESS`}
          </ThemedText>
        </View>
        <Pressable onPress={() => useAuthStore.getState().clearSession()} style={styles.signOutLink}>
          <Ionicons name="log-out-outline" size={14} color="#F87171" />
          <ThemedText type="smallBold" style={{ color: '#F87171' }}>
            Sign out
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionKicker}>
          Overview
        </ThemedText>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={stat.label} style={[styles.statCard, { backgroundColor: statPalettes[index].bg[0] }]}>
            <View style={styles.statHead}>
              <Ionicons name={statPalettes[index].icon} size={18} color="rgba(255,255,255,0.72)" />
              <View style={styles.trendWrap}>
                <Ionicons name={stat.up ? 'trending-up-outline' : 'trending-down-outline'} size={12} color={stat.up ? '#E2E8F0' : '#FECACA'} />
                <ThemedText type="smallBold" style={{ color: stat.up ? 'rgba(255,255,255,0.9)' : '#FECACA' }}>
                  {stat.change}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="subtitle" style={styles.whiteText}>
              {stat.value}
            </ThemedText>
            <ThemedText type="small" style={styles.statLabel}>
              {stat.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionKicker}>
          Needs Attention
        </ThemedText>
      </View>

      <View style={[styles.listShell, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
        {pendingItems.map((item, index) => (
          <View
            key={item.label}
            style={[
              styles.attentionRow,
              index < pendingItems.length - 1 && styles.divider,
            ]}>
            <View style={[styles.statusDot, item.status === 'alert' ? styles.alertBg : item.status === 'warning' ? styles.warningBg : styles.infoBg]} />
            <ThemedText type="default" style={styles.attentionLabel}>
              {item.label}
            </ThemedText>
            <View style={[styles.countPill, item.status === 'alert' ? styles.countAlert : item.status === 'warning' ? styles.countWarning : styles.countInfo]}>
              <ThemedText type="smallBold" style={item.status === 'alert' ? styles.alertText : item.status === 'warning' ? styles.warningText : styles.infoText}>
                {String(item.count)}
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
          </View>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionKicker}>
          Quick Actions
        </ThemedText>
      </View>

      <View style={styles.quickGrid}>
        <QuickAction icon="person-add-outline" label="Add Member" color="#60A5FA" onPress={() => router.push('/admin-users' as never)} />
        <QuickAction icon="cloud-upload-outline" label="Upload Sermon" color="#C084FC" onPress={() => router.push('/admin-sermons' as never)} />
        <QuickAction icon="add-circle-outline" label="New Event" color="#4ADE80" onPress={() => router.push('/admin-events')} />
        <QuickAction icon="megaphone-outline" label="Announcement" color={theme.tint} onPress={() => router.push('/admin-announcements' as never)} />
        <QuickAction icon="cash-outline" label="View Giving" color="#34D399" onPress={() => router.push('/admin-donations' as never)} />
        <QuickAction icon="settings-outline" label="Settings" color="#94A3B8" onPress={() => router.push('/admin-settings' as never)} />
        <QuickAction icon="bar-chart-outline" label="Analytics" color="#FB7185" onPress={() => router.push('/admin-analytics' as never)} />
        <QuickAction icon="checkmark-done-outline" label="Attendance" color="#22C55E" onPress={() => router.push('/admin-attendance' as never)} />
        <QuickAction icon="albums-outline" label="Series" color="#A855F7" onPress={() => router.push('/admin-series' as never)} />
      </View>

      <View style={styles.sectionRow}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionKicker}>
          Recent Activity
        </ThemedText>
        <Pressable onPress={() => router.push('/admin-audit' as never)}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            View All
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.activityStack}>
        {activities.slice(0, 5).map((item: any, index: number) => (
          <View key={`${item?.id ?? index}`} style={[styles.activityCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <Ionicons
              name={index % 2 === 0 ? 'flash-outline' : 'checkmark-circle-outline'}
              size={16}
              color={index % 2 === 0 ? theme.tint : '#4ADE80'}
            />
            <View style={styles.activityCopy}>
              <ThemedText type="small">{item?.description || item?.message || item?.action || 'Platform activity'}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {item?.created_at || item?.createdAt || item?.timestamp || 'Now'}
            </ThemedText>
          </View>
        ))}
        {activities.length === 0 ? (
          <View style={[styles.activityCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' }]}>
            <ThemedText type="small">No recent activity yet.</ThemedText>
          </View>
        ) : null}
      </View>

    </AdminShell>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.quickCard, { borderColor: `${color}33`, backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon} size={20} color={color} />
      <ThemedText type="smallBold" style={styles.quickLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const formatMetric = (value: unknown) => {
  const number = toFiniteNumber(value);
  if (number !== null) return number.toLocaleString();
  if (typeof value === 'string' && value.trim()) return value;
  return '0';
};

const formatCurrency = (value: unknown) => {
  const number = toFiniteNumber(value);
  return Number.isFinite(number) ? `$${number.toLocaleString()}` : '$0';
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.three,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 30,
    lineHeight: 34,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIconShell: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  alertDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: Radius.pill,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  alertDotText: {
    color: '#FFFFFF',
    fontSize: 8,
    lineHeight: 10,
  },
  adminAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteText: {
    color: '#FFFFFF',
  },
  adminBanner: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  adminBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCopy: {
    flex: 1,
    gap: 2,
  },
  signOutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noticeCard: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  primaryButton: {
    minHeight: 46,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    marginTop: Spacing.one,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionKicker: {
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  statCard: {
    width: '47%',
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  statHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trendWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.7)',
  },
  listShell: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  attentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  alertBg: {
    backgroundColor: '#F87171',
  },
  warningBg: {
    backgroundColor: '#FBBF24',
  },
  infoBg: {
    backgroundColor: '#60A5FA',
  },
  attentionLabel: {
    flex: 1,
  },
  countPill: {
    minWidth: 28,
    height: 22,
    paddingHorizontal: 8,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countAlert: {
    backgroundColor: 'rgba(248,113,113,0.16)',
  },
  countWarning: {
    backgroundColor: 'rgba(251,191,36,0.16)',
  },
  countInfo: {
    backgroundColor: 'rgba(96,165,250,0.16)',
  },
  alertText: {
    color: '#F87171',
  },
  warningText: {
    color: '#FBBF24',
  },
  infoText: {
    color: '#60A5FA',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  quickCard: {
    width: '31%',
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.two,
    alignItems: 'center',
    gap: Spacing.two,
  },
  quickLabel: {
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 13,
  },
  activityStack: {
    gap: Spacing.two,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
  },
  activityCopy: {
    flex: 1,
  },
});
