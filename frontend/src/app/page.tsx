'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Users, Heart, BookOpen } from 'lucide-react';
import { useLatestNews, useRecentSermons, useUpcomingEvents } from '@/hooks/useApi';

export default function HomePage() {
  const { data: recentSermons, isLoading: sermonsLoading } = useRecentSermons();
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents();
  const { data: latestNews, isLoading: newsLoading } = useLatestNews(3);

  return (
    <div>
      <section className="gradient-primary relative overflow-hidden py-20 text-white sm:py-28 lg:py-36">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml')] opacity-10" />
        </div>

        <div className="container-max relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Welcome to ANT PRESS
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-cyan-50 sm:text-xl">
              Your complete church management and community engagement platform
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className=" text-sky-800 hover:bg-slate-100 hover:text-black">
                <Link href="/sermons">
                  Watch Sermons <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white  hover:bg-sky-800/40">
                <Link href="/events">View Events</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white bg-white/10 hover:bg-white/20">
                <Link href="/donate">Give Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing bg-white dark:bg-slate-950">
        <div className="container-max">
          <div className="grid gap-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm ring-1 ring-slate-100 dark:border-slate-800 dark:bg-slate-900/70 dark:ring-slate-800 lg:grid-cols-[1.5fr_1fr] lg:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-300">
                Support The Mission
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Give securely and keep every ministry moving forward
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ui-muted">
                Use the giving page to contribute to tithe, offering, ministry support, or general needs.
                Donations are tracked in your account so you can review your giving history anytime.
              </p>
            </div>
            <div className="flex flex-col justify-center gap-3 rounded-2xl bg-white p-5 dark:bg-slate-950">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Ways to give</p>
                <p className="mt-2 text-sm text-ui-subtle">
                  Card, bank transfer, mobile money, or offline cash records through the same flow.
                </p>
              </div>
              <Button asChild size="lg">
                <Link href="/donate">Open Giving Page</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/dashboard">View Your Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="container-max">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">What We Offer</h2>
            <p className="mt-4 text-ui-subtle">
              Experience church like never before with our comprehensive platform
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: BookOpen,
                title: 'Sermons',
                description: 'Access our complete sermon library',
              },
              {
                icon: Calendar,
                title: 'Events',
                description: 'Never miss an important church event',
              },
              {
                icon: Heart,
                title: 'Prayer Requests',
                description: 'Submit and receive community prayers',
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Connect with church members',
              },
            ].map((feature, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:ring-slate-800">
                <feature.icon className="mx-auto h-12 w-12 text-sky-700 dark:text-cyan-300" />
                <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ui-subtle">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-slate-50 dark:bg-slate-900">
        <div className="container-max">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight">Recent Sermons</h2>
            <Button asChild variant="outline">
              <Link href="/sermons">View All</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {sermonsLoading && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
                Loading sermons...
              </div>
            )}
            {!sermonsLoading && (!recentSermons || recentSermons.length === 0) && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
                No sermons available yet.
              </div>
            )}
            {recentSermons?.slice(0, 3).map((sermon: any) => (
              <Link key={sermon.id} href={`/sermons/${sermon.id}`} className="group block">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950">
                  <div className="aspect-video bg-gradient-to-br from-sky-700 via-cyan-600 to-blue-600" />
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-lg font-bold group-hover:text-sky-700 dark:group-hover:text-cyan-300">{sermon.title}</h3>
                    <p className="mt-2 text-sm text-ui-subtle">{sermon.speaker}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing">
        <div className="container-max">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight">Upcoming Events</h2>
            <Button asChild variant="outline">
              <Link href="/events">View All</Link>
            </Button>
          </div>

          <div className="mt-8 space-y-4">
            {eventsLoading && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
                Loading events...
              </div>
            )}
            {!eventsLoading && (!upcomingEvents || upcomingEvents.length === 0) && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
                No upcoming events right now.
              </div>
            )}
            {upcomingEvents?.slice(0, 3).map((event: any) => (
              <Link key={event.id} href={`/events/${event.id}`} className="block">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{event.name}</h3>
                    <p className="mt-1 text-sm text-ui-subtle">{event.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sky-700 dark:text-cyan-300">
                      {new Date(event.event_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-spacing bg-slate-50 dark:bg-slate-900">
        <div className="container-max">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight">Announcements & News</h2>
            <Button asChild variant="outline">
              <Link href="/news">View All</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {newsLoading && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
                Loading announcements...
              </div>
            )}
            {!newsLoading && (!latestNews || latestNews.length === 0) && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
                No announcements posted yet.
              </div>
            )}
            {latestNews?.map((post: any) => (
              <Link key={post.id} href={`/news/${post.id}`} className="group block">
                <div className="h-full rounded-xl border border-slate-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950">
                  <h3 className="line-clamp-2 text-lg font-bold group-hover:text-sky-700 dark:group-hover:text-cyan-300">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-ui-subtle">{post.summary}</p>
                  <p className="mt-3 text-xs text-ui-subtle">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="gradient-primary section-spacing text-white">
        <div className="container-max text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to Join Our Community?</h2>
          <p className="mt-4 text-lg text-cyan-50">
            Register now to access exclusive features and stay connected
          </p>
          <Button asChild size="lg" className="mt-8  text-sky-800 hover:bg-slate-100 hover:text-black">
            <Link href="/register">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
