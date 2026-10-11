'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarDays, ClipboardCheck, ClipboardList, Gift, Heart, User, UserRound } from 'lucide-react';
import QrCode from '@/components/attendance/QrCode';
import { canTakeAttendance } from '@/components/attendance/StaffGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';
import Section from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import Tile from '@/components/ui/tile';
import { useDonations, useMyCheckInCard, usePrayerRequests, useProfile } from '@/hooks/useApi';

const quickActions = [
  { href: '/donate', label: 'Give Online', icon: Gift },
  { href: '/profile', label: 'Update Profile', icon: UserRound },
  { href: '/dashboard/registrations', label: 'My Registrations', icon: ClipboardList },
  { href: '/events', label: 'Explore Events', icon: CalendarDays },
];

const stayConnected = [
  { href: '/news', label: 'Read the latest news' },
  { href: '/sermons', label: 'Browse sermon content' },
  { href: '/ministries', label: 'Find active ministries' },
  { href: '/events', label: 'See upcoming events' },
];

export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile();
  const { data: donations, isLoading: donationsLoading, isError: donationsError } = useDonations();
  const { data: prayers, isLoading: prayersLoading, isError: prayersError } = usePrayerRequests();

  const displayName = `${profile?.first_name || profile?.firstName || ''} ${profile?.last_name || profile?.lastName || ''}`.trim();

  return (
    <div className="container-max space-y-12 py-10 sm:py-12">
      <PageHeader
        eyebrow="Member dashboard"
        title={displayName || 'Welcome back'}
        description="Track your profile, giving and prayer activity in one place."
        actions={
          <>
            <Button asChild>
              <Link href="/donate">Make a Donation</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/profile">Update Profile</Link>
            </Button>
          </>
        }
      />

      <section aria-label="Your activity" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={User}
          title="Profile"
          value={displayName || 'Member account'}
          subtext={profile?.email || 'Your account details'}
          linkHref="/profile"
          linkLabel="Open profile"
          loading={profileLoading}
          error={profileError}
        />
        <MetricCard
          icon={Gift}
          title="Donations"
          value={String(donations?.length || 0)}
          subtext="Recorded giving entries"
          linkHref="/donate"
          linkLabel="Give again"
          loading={donationsLoading}
          error={donationsError}
        />
        <MetricCard
          icon={Heart}
          title="Prayer Requests"
          value={String(prayers?.length || 0)}
          subtext="Requests attached to your account"
          linkHref="/prayer/new"
          linkLabel="Submit prayer"
          loading={prayersLoading}
          error={prayersError}
        />
      </section>

      <Section title="Quick actions">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...quickActions, ...(canTakeAttendance(profile) ? [{ href: '/check-in', label: 'Take attendance', icon: ClipboardCheck }] : [])].map(
            (action) => (
              <Tile key={action.href} href={action.href} icon={action.icon} label={action.label} />
            )
          )}
        </div>
      </Section>

      <Section title="My check-in card">
        <MyCheckInCard />
      </Section>

      <Section title="Stay connected">
        <Card>
          <ul className="divide-y divide-border">
            {stayConnected.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </div>
  );
}

// The member's own QR card, scanned by ushers at the entrance.
function MyCheckInCard() {
  const { data: card, isLoading, isError, refetch } = useMyCheckInCard();

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        {isLoading ? (
          <Skeleton className="h-[200px] w-[200px]" />
        ) : isError || !card ? (
          <div className="space-y-2">
            <p className="text-sm text-muted">Your check-in card could not be loaded.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <>
            <QrCode text={card.qr_text} size={200} label="Your check-in card" />
            <div className="space-y-2">
              <p className="font-mono text-lg tracking-widest text-foreground">{card.code}</p>
              <p className="text-sm text-muted">Show this at the entrance to be checked in.</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtext,
  linkHref,
  linkLabel,
  loading,
  error,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  subtext: string;
  linkHref: string;
  linkLabel: string;
  loading: boolean;
  error: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-24" />
        ) : (
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-foreground">{error ? '—' : value}</p>
        )}
        <p className="mt-1 break-words text-sm text-muted">{error ? "Couldn't load right now" : subtext}</p>
        <Button asChild variant="secondary" size="sm" className="mt-5 self-start">
          <Link href={linkHref}>{linkLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
