import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandCard } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  useAdminDashboardContentStats,
  useAdminDashboardEngagementStats,
  useAdminDashboardOverview,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminAnalyticsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const overviewQuery = useAdminDashboardOverview(isAdmin);
  const contentQuery = useAdminDashboardContentStats(isAdmin);
  const engagementQuery = useAdminDashboardEngagementStats(isAdmin);

  if (!user || !isAdmin) {
    return null;
  }

  const overview = overviewQuery.data;
  const content = contentQuery.data;
  const engagement = engagementQuery.data;
  const activeMembers = toFiniteNumber(overview?.users?.members || overview?.users?.total);
  const sermonCount = toFiniteNumber(overview?.content?.sermons);
  const registrationsLast30Days = toFiniteNumber(engagement?.registrations_last_30_days);
  const totalGiving = toFiniteNumber(overview?.donations?.total_amount);
  const topEventsCount = Array.isArray(content?.top_events_by_registrations)
    ? content.top_events_by_registrations.length
    : 0;
  const donationMixCount = Array.isArray(engagement?.donations_by_type_last_30_days)
    ? engagement.donations_by_type_last_30_days.length
    : 0;
  const adminActions = toFiniteNumber(engagement?.admin_actions_last_30_days);
  const unreadPrayerLoad = toFiniteNumber(overview?.prayers?.pending_count);

  const cards = [
    { label: 'Active Members', value: String(activeMembers), color: '#60A5FA', icon: 'people-outline' as const },
    { label: 'Sermon Library', value: String(sermonCount), color: '#C084FC', icon: 'play-circle-outline' as const },
    { label: 'Event RSVPs', value: String(registrationsLast30Days), color: '#4ADE80', icon: 'calendar-outline' as const },
    { label: 'Total Giving', value: `$${totalGiving.toLocaleString()}`, color: '#FBBF24', icon: 'cash-outline' as const },
  ];

  return (
    <AdminShell activeTab="/admin">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#FB7185', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Analytics Overview</ThemedText>
        </View>
      </View>

      <View style={styles.grid}>
        {cards.map((card) => (
          <View key={card.label} style={[styles.kpiCard, { backgroundColor: `${card.color}14`, borderColor: `${card.color}28` }]}>
            <Ionicons name={card.icon} size={18} color={card.color} />
            <ThemedText type="subtitle" style={{ color: card.color }}>
              {card.value}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {card.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Content performance</ThemedText>
        <ThemedText type="small">Top events by registrations: {topEventsCount}</ThemedText>
        <ThemedText type="small">Donation mix entries: {donationMixCount}</ThemedText>
      </BrandCard>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Engagement</ThemedText>
        <MetricLine label="Admin actions" value={String(adminActions)} />
        <MetricLine label="Registrations (30d)" value={String(registrationsLast30Days)} />
        <MetricLine label="Unread prayer load" value={String(unreadPrayerLoad)} />
      </BrandCard>
    </AdminShell>
  );
}

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricLine}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: {
    width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  kpiCard: {
    width: '47%', borderWidth: 1, borderRadius: Radius.medium, padding: Spacing.three, gap: Spacing.one,
  },
  metricLine: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
});
