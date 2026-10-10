import React from 'react';

import { AdminShell } from '@/components/admin-shell';
import { ListGroup, ListRow, ScreenHeader, SectionHeader, StatGrid, StatTile } from '@/components/kit';
import {
  useAdminDashboardContentStats,
  useAdminDashboardEngagementStats,
  useAdminDashboardOverview,
} from '@/hooks/use-api';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

export default function AdminAnalyticsScreen() {
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

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader back eyebrow="Admin" title="Analytics" />

      <StatGrid>
        <StatTile label="Active members" value={String(activeMembers)} icon="people-outline" />
        <StatTile label="Sermon library" value={String(sermonCount)} icon="play-circle-outline" />
        <StatTile label="Event RSVPs" value={String(registrationsLast30Days)} icon="calendar-outline" />
        <StatTile label="Total giving" value={formatCedis(totalGiving)} icon="cash-outline" />
      </StatGrid>

      <SectionHeader title="Content performance" />
      <ListGroup>
        <ListRow label="Top events by registrations" value={String(topEventsCount)} />
        <ListRow label="Donation mix entries" value={String(donationMixCount)} />
      </ListGroup>

      <SectionHeader title="Engagement" />
      <ListGroup>
        <ListRow label="Admin actions" value={String(adminActions)} />
        <ListRow label="Registrations (30d)" value={String(registrationsLast30Days)} />
        <ListRow label="Unread prayer load" value={String(unreadPrayerLoad)} />
      </ListGroup>
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
