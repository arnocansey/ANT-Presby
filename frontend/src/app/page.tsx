'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Clock,
  Gift,
  Heart,
  MapPin,
  Newspaper,
  Play,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLatestNews, useRecentSermons, useUpcomingEvents } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';

const sermonGradients = [
  'from-indigo-600 to-purple-600',
  'from-teal-600 to-cyan-600',
  'from-rose-600 to-pink-600',
];

const eventBadgeColors = [
  'bg-amber-500',
  'bg-purple-500',
  'bg-green-600',
];

export default function HomePage() {
  const { data: recentSermons, isLoading: sermonsLoading } = useRecentSermons();
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents();
  const { data: latestNews, isLoading: newsLoading } = useLatestNews(3);
  const featuredEvent = upcomingEvents?.[0];

  return (
    <div className="pb-10">
      <section className="container-max py-10 md:py-16">
        <div
          className="relative min-h-[380px] overflow-hidden rounded-[2rem] md:min-h-[460px]"
          style={{
            background:
              'linear-gradient(135deg, rgb(180 83 9) 0%, rgb(245 158 11) 50%, rgb(234 88 12) 100%)',
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.45'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative flex min-h-[380px] items-end p-8 md:min-h-[460px] md:p-12">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
                {featuredEvent ? 'NEXT EVENT LIVE' : 'ANT PRESS LIVE'}
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-6xl">
                Where stories,
                <br />
                sermons, and
                <br />
                community meet
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-amber-50 sm:text-lg">
                Explore real sermons, upcoming events, live announcements, and giving tools from one connected frontend.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/sermons"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-semibold !text-amber-700 shadow-sm transition-colors hover:bg-amber-50 hover:!text-amber-800"
                >
                  <Play className="mr-2 h-4 w-4 fill-current text-amber-700" />
                  Watch Sermons
                </Link>
                <Link
                  href="/events"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-white/50 bg-transparent px-8 text-base font-semibold !text-white transition-colors hover:bg-white/10 hover:!text-white"
                >
                  View Events
                  <ArrowRight className="ml-2 h-4 w-4 text-white" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-max mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoTile
          icon={Clock}
          label="Latest Update"
          value={featuredEvent ? formatDate(featuredEvent.event_date || featuredEvent.eventDate) : 'Fresh content published regularly'}
        />
        <InfoTile
          icon={MapPin}
          label="Featured Event"
          value={featuredEvent?.location || 'Track upcoming gatherings and ministry moments'}
        />
        <InfoTile
          icon={Gift}
          label="Giving"
          value="Donate securely with tracked records and payment verification"
        />
      </section>

      <section className="container-max mb-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Latest Sermons
          </h2>
          <Link href="/sermons" className="flex items-center gap-1.5 text-sm font-medium text-sky-700 dark:text-cyan-300">
            See All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {sermonsLoading && <StatusCard text="Loading sermons..." />}
          {!sermonsLoading && (!recentSermons || recentSermons.length === 0) && (
            <StatusCard text="No sermons available yet." />
          )}
          {recentSermons?.slice(0, 3).map((sermon: any, index: number) => (
            <Link key={sermon.id} href={`/sermons/${sermon.id}`} className="group block">
              <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white transition-colors hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40">
                <div className={`relative flex h-44 items-center justify-center bg-gradient-to-br ${sermonGradients[index % sermonGradients.length]}`}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
                    <Play className="ml-1 h-7 w-7 fill-white text-white" />
                  </div>
                </div>
                <div className="space-y-2 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">
                    Sermon Library
                  </p>
                  <h3 className="line-clamp-2 text-lg font-bold text-slate-950 dark:text-white">
                    {sermon.title}
                  </h3>
                  <p className="text-sm text-ui-subtle">
                    {sermon.speaker || 'ANT PRESS'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-max mb-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Upcoming Events
          </h2>
          <Link href="/events" className="flex items-center gap-1.5 text-sm font-medium text-sky-700 dark:text-cyan-300">
            See All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-4">
          {eventsLoading && <StatusCard text="Loading events..." />}
          {!eventsLoading && (!upcomingEvents || upcomingEvents.length === 0) && (
            <StatusCard text="No upcoming events right now." />
          )}
          {upcomingEvents?.slice(0, 3).map((event: any, index: number) => {
            const eventDate = new Date(event.event_date || event.eventDate);

            return (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <div className="flex flex-col gap-4 rounded-[1.4rem] border border-slate-200 bg-white p-5 transition-colors hover:border-sky-300 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40">
                  <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${eventBadgeColors[index % eventBadgeColors.length]}`}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                      {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-2xl font-black text-white">
                      {eventDate.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-950 dark:text-white">{event.name}</h3>
                    <p className="mt-1 text-sm text-ui-subtle">
                      {event.location || 'Location to be announced'}
                    </p>
                  </div>
                  <span className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition-colors group-hover:border-sky-300 group-hover:text-sky-700 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:group-hover:border-cyan-500/40 dark:group-hover:text-cyan-300">
                    Details
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-max mb-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Get Involved
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: '/donate',
              icon: Gift,
              label: 'Give Online',
              description: 'Support tithe, offering, ministry needs, and general giving.',
              iconClass: 'bg-amber-500/15 text-amber-500',
            },
            {
              href: '/ministries',
              icon: Users,
              label: 'Ministries',
              description: 'Browse ministry groups and stay connected to active communities.',
              iconClass: 'bg-pink-500/15 text-pink-500',
            },
            {
              href: '/prayer/new',
              icon: Heart,
              label: 'Prayer Request',
              description: 'Submit a prayer request and let the community stand with you.',
              iconClass: 'bg-rose-500/15 text-rose-500',
            },
            {
              href: '/news',
              icon: Newspaper,
              label: 'News & Updates',
              description: 'Read current announcements and published updates.',
              iconClass: 'bg-blue-500/15 text-blue-500',
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex h-full cursor-pointer flex-col gap-3 rounded-[1.4rem] border border-slate-200 bg-white p-5 transition-colors hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.iconClass}`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-950 dark:text-white">{item.label}</p>
                  <p className="mt-2 text-sm text-ui-subtle">{item.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-max mb-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            Announcements & News
          </h2>
          <Link href="/news" className="flex items-center gap-1.5 text-sm font-medium text-sky-700 dark:text-cyan-300">
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {newsLoading && <StatusCard text="Loading announcements..." />}
          {!newsLoading && (!latestNews || latestNews.length === 0) && (
            <StatusCard text="No announcements posted yet." />
          )}
          {latestNews?.map((post: any) => (
            <Link key={post.id} href={`/news/${post.id}`} className="group block">
              <div className="h-full rounded-[1.4rem] border border-slate-200 bg-white p-5 transition-colors hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40">
                <h3 className="line-clamp-2 text-lg font-bold text-slate-950 group-hover:text-sky-700 dark:text-white dark:group-hover:text-cyan-300">
                  {post.title}
                </h3>
                <p className="mt-3 line-clamp-3 text-sm text-ui-subtle">
                  {post.summary || post.excerpt || 'Read the latest update from ANT PRESS.'}
                </p>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  {post.published_at ? formatDate(post.published_at) : 'Published update'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-max">
        <div className="gradient-primary rounded-[2rem] px-5 py-12 text-center text-white shadow-xl sm:px-12 sm:py-14">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Ready to join the community?
          </h2>
          <p className="mt-4 text-lg text-cyan-50">
            Create an account to track giving, manage your profile, and stay connected.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-base font-semibold !text-sky-800 shadow-sm transition-colors hover:bg-slate-100 hover:!text-sky-900"
          >
            Get Started
          </Link>
        </div>
      </section>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-[1.4rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-700/10 text-sky-700 dark:bg-cyan-400/10 dark:text-cyan-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function StatusCard({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-6 text-sm text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      {text}
    </div>
  );
}
