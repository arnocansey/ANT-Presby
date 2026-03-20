'use client';

import React from 'react';
import {
  useDashboardContentStats,
  useDashboardEngagementStats,
  useDashboardOverview,
  useRecentActivities,
  useRevenueStats,
  useUserGrowthStats,
} from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MonthlyCountStat = {
  month?: string;
  count?: number | string;
};

type MonthlyRevenueStat = {
  month?: string;
  total?: number | string;
};

const toNumber = (value: number | string | undefined) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
};

const formatMonth = (value?: string) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit' }) : 'N/A';

export default function AdminDashboardPage() {
  const { data: overview } = useDashboardOverview();
  const { data: users } = useUserGrowthStats();
  const { data: revenue } = useRevenueStats();
  const { data: contentStats } = useDashboardContentStats();
  const { data: engagementStats } = useDashboardEngagementStats();
  const { data: activities } = useRecentActivities();

  const userStats = (users ?? []) as MonthlyCountStat[];
  const revenueStats = (revenue ?? []) as MonthlyRevenueStat[];

  const totalUsers = overview?.users?.total ?? 0;
  const totalEvents = overview?.events?.total ?? 0;
  const upcomingEvents = overview?.events?.upcoming ?? 0;
  const totalSermons = overview?.content?.sermons ?? 0;
  const newUsersThisYear = userStats.reduce((sum, item) => sum + toNumber(item.count), 0);
  const revenueThisYear = revenueStats.reduce((sum, item) => sum + toNumber(item.total), 0);
  const newsStats = contentStats?.news || {};
  const ministryBreakdown = contentStats?.sermons_by_ministry || [];
  const topEvents = contentStats?.top_events_by_registrations || [];
  const donationMix = engagementStats?.donations_by_type_last_30_days || [];
  const recentItems = (activities ?? []) as Array<{ type: string; description: string; created_at: string }>;

  const maxUserCount = Math.max(...userStats.map((item) => toNumber(item.count)), 1);
  const maxRevenue = Math.max(...revenueStats.map((item) => toNumber(item.total)), 1);
  const maxMinistryCount = Math.max(...ministryBreakdown.map((item: any) => item.count || 0), 1);
  const maxEventRegistrations = Math.max(...topEvents.map((item: any) => item.registrations || 0), 1);

  return (
    <div className="container-max space-y-6 py-6 sm:py-8 lg:py-12">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-ui-subtle">Operations, publishing, and engagement at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{totalUsers}</p>
            <p className="text-ui-muted">New signups in the last 12 months: {newUsersThisYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Events</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{totalEvents}</p>
            <p className="text-ui-muted">Upcoming active events: {upcomingEvents}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sermons</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{totalSermons}</p>
            <p className="text-ui-muted">Published sermon records in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              GHS {revenueThisYear.toLocaleString()}
            </p>
            <p className="text-ui-muted">Completed donations in the last 12 months</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Publishing Workflow</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Draft', newsStats.draft || 0],
              ['Review', newsStats.review || 0],
              ['Scheduled', newsStats.scheduled || 0],
              ['Published', newsStats.published || 0],
              ['Archived', newsStats.archived || 0],
              ['Featured', newsStats.featured || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-ui-subtle">{label}</p>
                <p className="mt-2 text-2xl font-bold">{value as React.ReactNode}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Engagement Snapshot</CardTitle></CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              ['Unread Notifications', engagementStats?.notifications?.unread || 0],
              ['Unread Contacts', engagementStats?.contacts?.unread || 0],
              ['Registrations (30d)', engagementStats?.registrations_last_30_days || 0],
              ['Completed Donations (30d)', engagementStats?.completed_donations_last_30_days || 0],
              ['Admin Actions (30d)', engagementStats?.admin_actions_last_30_days || 0],
              ['Total Notifications', engagementStats?.notifications?.total || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-ui-subtle">{label}</p>
                <p className="mt-2 text-2xl font-bold">{value as React.ReactNode}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>User Growth</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {userStats.length === 0 && <p className="text-sm text-ui-subtle">No user growth data yet.</p>}
            {userStats.map((item) => {
              const count = toNumber(item.count);
              const width = `${Math.max((count / maxUserCount) * 100, 6)}%`;
              return (
                <div key={`${item.month}-${count}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ui-muted">{formatMonth(item.month)}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-sky-700 dark:bg-cyan-400" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Sermons by Ministry</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {ministryBreakdown.length === 0 && <p className="text-sm text-ui-subtle">No ministry breakdown yet.</p>}
            {ministryBreakdown.map((item: any) => {
              const width = `${Math.max(((item.count || 0) / maxMinistryCount) * 100, 8)}%`;
              return (
                <div key={`${item.ministry_id}-${item.count}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ui-muted">{item.ministry_name}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top Events by Registration</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {topEvents.length === 0 && <p className="text-sm text-ui-subtle">No event registrations yet.</p>}
            {topEvents.map((item: any) => {
              const width = `${Math.max(((item.registrations || 0) / maxEventRegistrations) * 100, 8)}%`;
              return (
                <div key={`${item.id}-${item.registrations}`} className="space-y-1">
                  <div className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-50">{item.name}</p>
                      <p className="text-ui-subtle">{formatMonth(item.event_date)}</p>
                    </div>
                    <span className="font-semibold">{item.registrations}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-amber-500 dark:bg-amber-300" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Donation Mix (30 Days)</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {donationMix.length === 0 && <p className="text-sm text-ui-subtle">No completed donations in the last 30 days.</p>}
            {donationMix.map((item: any) => (
              <div key={item.donation_type} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-50">
                      {String(item.donation_type).replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-ui-subtle">{item.count} completed donation{item.count === 1 ? '' : 's'}</p>
                  </div>
                  <p className="text-lg font-bold">GHS {toNumber(item.total_amount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {revenueStats.length === 0 && <p className="text-sm text-ui-subtle">No revenue data yet.</p>}
            {revenueStats.map((item) => {
              const total = toNumber(item.total);
              const width = `${Math.max((total / maxRevenue) * 100, 6)}%`;
              return (
                <div key={`${item.month}-${total}`} className="space-y-1">
                  <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-ui-muted">{formatMonth(item.month)}</span>
                    <span className="font-semibold">GHS {total.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-violet-600 dark:bg-violet-400" style={{ width }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recentItems.length === 0 && <p className="text-sm text-ui-subtle">No activity recorded yet.</p>}
            {recentItems.map((item, index) => (
              <div key={`${item.type}-${item.created_at}-${index}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{item.description}</p>
                <div className="mt-1 flex flex-col gap-1 text-xs text-ui-subtle sm:flex-row sm:items-center sm:justify-between">
                  <span>{item.type}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
