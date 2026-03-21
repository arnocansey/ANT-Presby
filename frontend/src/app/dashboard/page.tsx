'use client';

import Link from 'next/link';
import { Calendar, Gift, Heart, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDonations, usePrayerRequests, useProfile } from '@/hooks/useApi';

export default function DashboardPage() {
  const { data: profile } = useProfile();
  const { data: donations } = useDonations();
  const { data: prayers } = usePrayerRequests();

  const displayName = `${profile?.first_name || profile?.firstName || ''} ${profile?.last_name || profile?.lastName || ''}`.trim();

  return (
    <div className="container-max py-10">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-10 text-white shadow-xl sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Member Dashboard</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">
          {displayName || 'Welcome back'}
        </h1>
        <p className="mt-3 max-w-2xl text-slate-200">
          Track your profile, giving, and prayer activity from one place while staying close to the wider ANT PRESS experience.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400">
            <Link href="/donate">Make a Donation</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Link href="/profile">Update Profile</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <MetricCard
          icon={User}
          title="Profile"
          value={displayName || 'Member account'}
          subtext={profile?.email || 'Your account details'}
          linkHref="/profile"
          linkLabel="Open profile"
        />
        <MetricCard
          icon={Gift}
          title="Donations"
          value={String(donations?.length || 0)}
          subtext="Recorded giving entries"
          linkHref="/donate"
          linkLabel="Give again"
        />
        <MetricCard
          icon={Heart}
          title="Prayer Requests"
          value={String(prayers?.length || 0)}
          subtext="Requests attached to your account"
          linkHref="/prayer/new"
          linkLabel="Submit prayer"
        />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Quick Actions
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Give Online', '/donate'],
              ['Update Profile', '/profile'],
              ['My Registrations', '/dashboard/registrations'],
              ['Explore Events', '/events'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Stay Connected
          </h2>
          <div className="mt-5 space-y-3">
            {[
              ['Read the latest news', '/news'],
              ['Browse sermon content', '/sermons'],
              ['Find active ministries', '/ministries'],
              ['See upcoming events', '/events'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
              >
                <span>{label}</span>
                <Calendar className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtext,
  linkHref,
  linkLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  subtext: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-cyan-950/50 dark:text-cyan-300">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-ui-subtle">{title}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-2 text-sm text-ui-muted">{subtext}</p>
      <Link
        href={linkHref}
        className="mt-5 inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
