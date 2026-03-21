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
  const revenueThisYear = revenueStats.reduce((sum, item) => sum + toNumber(item.total), 0);
  const newsStats = contentStats?.news || {};
  const topEvents = contentStats?.top_events_by_registrations || [];
  const donationMix = engagementStats?.donations_by_type_last_30_days || [];
  const recentItems = (activities ?? []) as Array<{ type: string; description: string; created_at: string }>;
  const maxRevenue = Math.max(...revenueStats.map((item) => toNumber(item.total)), 1);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-10 text-white shadow-xl sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Admin Dashboard</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">Operations at a glance</h1>
        <p className="mt-3 max-w-2xl text-slate-200">
          Review publishing, engagement, growth, and giving from one connected admin overview.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Users', totalUsers, 'Members and admins currently in the system', 'from-sky-600 to-blue-600'],
          ['Events', totalEvents, `Upcoming active events: ${upcomingEvents}`, 'from-emerald-600 to-green-600'],
          ['Sermons', totalSermons, 'Published sermon records in the system', 'from-violet-600 to-purple-600'],
          ['Revenue', `GHS ${revenueThisYear.toLocaleString()}`, 'Completed donations in the last 12 months', 'from-amber-500 to-orange-500'],
        ].map(([label, value, text, gradient]) => (
          <div key={label} className={`rounded-[1.5rem] bg-gradient-to-br p-6 text-white shadow-lg ${gradient}`}>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">{label}</p>
            <p className="mt-4 text-4xl font-black tracking-tight">{value}</p>
            <p className="mt-3 text-sm text-white/80">{text}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Publishing Workflow">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Draft', newsStats.draft || 0],
              ['Review', newsStats.review || 0],
              ['Scheduled', newsStats.scheduled || 0],
              ['Published', newsStats.published || 0],
              ['Archived', newsStats.archived || 0],
              ['Featured', newsStats.featured || 0],
            ].map(([label, value]) => (
              <StatBox key={label as string} label={label as string} value={String(value)} />
            ))}
          </div>
        </Panel>

        <Panel title="Engagement Snapshot">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Unread Notifications', engagementStats?.notifications?.unread || 0],
              ['Unread Contacts', engagementStats?.contacts?.unread || 0],
              ['Registrations (30d)', engagementStats?.registrations_last_30_days || 0],
              ['Completed Donations (30d)', engagementStats?.completed_donations_last_30_days || 0],
              ['Admin Actions (30d)', engagementStats?.admin_actions_last_30_days || 0],
              ['Total Notifications', engagementStats?.notifications?.total || 0],
            ].map(([label, value]) => (
              <StatBox key={label as string} label={label as string} value={String(value)} />
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Revenue Trend">
          <div className="space-y-3">
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
          </div>
        </Panel>

        <Panel title="Recent Activity">
          <div className="space-y-3">
            {recentItems.length === 0 && <p className="text-sm text-ui-subtle">No activity recorded yet.</p>}
            {recentItems.map((item, index) => (
              <div key={`${item.type}-${item.created_at}-${index}`} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{item.description}</p>
                <div className="mt-1 flex flex-col gap-1 text-xs text-ui-subtle sm:flex-row sm:items-center sm:justify-between">
                  <span>{item.type}</span>
                  <span>{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Top Events by Registration">
          <div className="space-y-3">
            {topEvents.length === 0 && <p className="text-sm text-ui-subtle">No event registrations yet.</p>}
            {topEvents.map((item: any) => (
              <div key={`${item.id}-${item.registrations}`} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-slate-50">{item.name}</p>
                    <p className="text-sm text-ui-subtle">{formatMonth(item.event_date)}</p>
                  </div>
                  <span className="text-lg font-black">{item.registrations}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Donation Mix (30 Days)">
          <div className="space-y-3">
            {donationMix.length === 0 && <p className="text-sm text-ui-subtle">No completed donations in the last 30 days.</p>}
            {donationMix.map((item: any) => (
              <div key={item.donation_type} className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-900 dark:text-slate-50">
                      {String(item.donation_type).replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-ui-subtle">{item.count} completed donation{item.count === 1 ? '' : 's'}</p>
                  </div>
                  <p className="text-lg font-black">GHS {toNumber(item.total_amount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ui-subtle">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
    </div>
  );
}
