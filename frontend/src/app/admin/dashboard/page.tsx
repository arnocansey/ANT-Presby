'use client';

import React from 'react';
import Link from 'next/link';
import {
  BellRing,
  BookOpenText,
  CalendarDays,
  Church,
  HeartHandshake,
  Megaphone,
  Radio,
  Users,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/admin/stat-card';
import { LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { formatCurrency } from '@/lib/utils';
import {
  useDashboardContentStats,
  useDashboardEngagementStats,
  useDashboardOverview,
  useRecentActivities,
  useRevenueStats,
} from '@/hooks/useApi';

type MonthlyRevenueStat = { month?: string; total?: number | string };
type ActivityItem = { type: string; description: string; created_at: string };

const toNumber = (value: number | string | undefined) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
};

// Month starts arrive as UTC midnight; format in UTC so they never show as the previous month.
const formatMonth = (value?: string) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' }) : 'N/A';

const isThisMonth = (value?: string) => {
  if (!value) return false;
  const month = new Date(value);
  const now = new Date();
  return month.getUTCFullYear() === now.getFullYear() && month.getUTCMonth() === now.getMonth();
};

const QUICK_ACTIONS = [
  { href: '/admin/sermons/new', label: 'New sermon', icon: Megaphone },
  { href: '/admin/events/new', label: 'New event', icon: CalendarDays },
  { href: '/admin/ministries/new', label: 'New ministry', icon: Church },
  { href: '/admin/devotionals', label: 'Write devotional', icon: BookOpenText },
  { href: '/admin/announcements', label: 'Send announcement', icon: BellRing },
  { href: '/admin/live', label: 'Go live', icon: Radio },
];

export default function AdminDashboardPage() {
  const overviewQuery = useDashboardOverview();
  const revenueQuery = useRevenueStats();
  const { data: contentStats, isLoading: contentLoading } = useDashboardContentStats();
  const { data: engagementStats, isLoading: engagementLoading } = useDashboardEngagementStats();
  const activitiesQuery = useRecentActivities();

  const overview = overviewQuery.data;
  const revenueStats = (revenueQuery.data ?? []) as MonthlyRevenueStat[];
  const givingThisMonth = toNumber(revenueStats.find((row) => isThisMonth(row.month))?.total);
  const revenueThisYear = revenueStats.reduce((sum, item) => sum + toNumber(item.total), 0);
  const maxRevenue = Math.max(...revenueStats.map((item) => toNumber(item.total)), 1);
  const newsStats = contentStats?.news || {};
  const topEvents = contentStats?.top_events_by_registrations || [];
  const donationMix = engagementStats?.donations_by_type_last_30_days || [];
  const recentItems = (activitiesQuery.data ?? []) as ActivityItem[];
  const figuresLoading = overviewQuery.isLoading;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Dashboard' }]}
        title="Dashboard"
        description="Members, giving, events and prayer at a glance."
      />

      {overviewQuery.isError && !overview ? (
        <LoadError
          what="the key figures"
          onRetry={() => {
            overviewQuery.refetch();
            revenueQuery.refetch();
          }}
        />
      ) : (
        <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Members"
            icon={Users}
            href="/admin/users"
            loading={figuresLoading}
            value={overview?.users?.members ?? 0}
            hint={`${overview?.users?.total ?? 0} accounts · ${overview?.users?.admins ?? 0} admins`}
          />
          <StatCard
            label="Giving this month"
            icon={Wallet}
            href="/admin/donations"
            loading={revenueQuery.isLoading}
            value={formatCurrency(givingThisMonth)}
            hint={`${formatCurrency(revenueThisYear)} in the last 12 months`}
          />
          <StatCard
            label="Upcoming events"
            icon={CalendarDays}
            href="/admin/events"
            loading={figuresLoading}
            value={overview?.events?.upcoming ?? 0}
            hint={`${overview?.events?.total ?? 0} events in total`}
          />
          <StatCard
            label="Pending prayer requests"
            icon={HeartHandshake}
            href="/admin/prayers"
            loading={figuresLoading}
            value={overview?.prayers?.pending_count ?? 0}
            hint="Waiting for approval"
          />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {QUICK_ACTIONS.map((action) => (
              <Button key={action.href} asChild variant="secondary" className="justify-start">
                <Link href={action.href}>
                  <action.icon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Recent activity"
          className="lg:col-span-2"
          action={
            <Link href="/admin/audit" className="text-sm font-semibold text-link hover:underline">
              View activity log
            </Link>
          }
        >
          {activitiesQuery.isLoading ? (
            <PanelSkeleton />
          ) : activitiesQuery.isError && recentItems.length === 0 ? (
            <LoadError what="recent activity" onRetry={() => activitiesQuery.refetch()} />
          ) : recentItems.length === 0 ? (
            <PanelEmpty>No activity recorded yet.</PanelEmpty>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
              {recentItems.map((item, index) => (
                <li
                  key={`${item.type}-${item.created_at}-${index}`}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">{item.description}</p>
                    <Badge tone="neutral">{item.type}</Badge>
                  </div>
                  <time dateTime={item.created_at} className="shrink-0 text-xs text-muted">
                    {new Date(item.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Giving by month">
          {revenueQuery.isLoading ? (
            <PanelSkeleton />
          ) : revenueStats.length === 0 ? (
            <PanelEmpty>No giving recorded in the last 12 months.</PanelEmpty>
          ) : (
            <ul className="space-y-3">
              {revenueStats.map((item) => {
                const total = toNumber(item.total);
                const width = `${Math.max((total / maxRevenue) * 100, 6)}%`;
                return (
                  <li key={`${item.month}-${total}`} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">{formatMonth(item.month)}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-2 rounded-full border border-border bg-surface" aria-hidden="true">
                      <div className="h-full rounded-full bg-primary" style={{ width }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Donation mix (30 days)">
          {engagementLoading ? (
            <PanelSkeleton />
          ) : donationMix.length === 0 ? (
            <PanelEmpty>No completed donations in the last 30 days.</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {donationMix.map((item: any) => (
                <li key={item.donation_type} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize text-foreground">
                      {String(item.donation_type).replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted">
                      {item.count} completed donation{item.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold text-foreground">{formatCurrency(toNumber(item.total_amount))}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Publishing">
          {contentLoading || figuresLoading ? (
            <PanelSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatBox label="Sermons" value={overview?.content?.sermons ?? 0} />
              <StatBox label="News drafts" value={newsStats.draft || 0} />
              <StatBox label="In review" value={newsStats.review || 0} />
              <StatBox label="Scheduled" value={newsStats.scheduled || 0} />
              <StatBox label="Published" value={newsStats.published || 0} />
              <StatBox label="Archived" value={newsStats.archived || 0} />
              <StatBox label="Featured" value={newsStats.featured || 0} />
            </div>
          )}
        </Panel>

        <Panel title="Engagement">
          {engagementLoading ? (
            <PanelSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatBox label="Unread notifications" value={engagementStats?.notifications?.unread || 0} />
              <StatBox label="Total notifications" value={engagementStats?.notifications?.total || 0} />
              <StatBox label="Unread messages" value={engagementStats?.contacts?.unread || 0} />
              <StatBox label="Registrations (30d)" value={engagementStats?.registrations_last_30_days || 0} />
              <StatBox label="Completed gifts (30d)" value={engagementStats?.completed_donations_last_30_days || 0} />
              <StatBox label="Admin actions (30d)" value={engagementStats?.admin_actions_last_30_days || 0} />
            </div>
          )}
        </Panel>
      </section>

      <Panel title="Top events by registration">
        {contentLoading ? (
          <PanelSkeleton />
        ) : topEvents.length === 0 ? (
          <PanelEmpty>No event registrations yet.</PanelEmpty>
        ) : (
          <ul className="divide-y divide-border">
            {topEvents.map((item: any) => (
              <li key={`${item.id}-${item.registrations}`} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm text-muted">{formatMonth(item.event_date)}</p>
                </div>
                <span className="shrink-0 text-lg font-bold text-foreground">
                  {item.registrations}
                  <span className="sr-only"> registrations</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`p-5 sm:p-6 ${className ?? ''}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function PanelEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
