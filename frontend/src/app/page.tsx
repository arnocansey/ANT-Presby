'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Newspaper, PlayCircle } from 'lucide-react';
import TodayDevotionalCard from '@/components/devotionals/TodayDevotionalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Section from '@/components/ui/section';
import { SkeletonCard } from '@/components/ui/skeleton';
import Tile from '@/components/ui/tile';
import { useLatestNews, useLiveStream, useRecentSermons, useUpcomingEvents } from '@/hooks/useApi';
import { APP_NAME } from '@/lib/app-config';
import { HUB_LINKS, MEMBER_HUB_LINK } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

const eventDateOf = (event: any) => new Date(event?.event_date || event?.eventDate);

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const sermons = useRecentSermons();
  const events = useUpcomingEvents();
  const news = useLatestNews(3);
  const live = useLiveStream(60_000);
  const isLive = Boolean(live.data?.is_live);
  const nextEvent = events.data?.[0];
  const hubLinks = isAuthenticated ? [...HUB_LINKS, MEMBER_HUB_LINK] : HUB_LINKS;

  return (
    <div className="space-y-14 pb-6 sm:space-y-16">
      {/* 1. Hero */}
      <section className="border-b border-border bg-surface">
        <div className="container-max grid items-center gap-8 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div className="space-y-5">
            {isLive ? <Badge tone="live">Live now</Badge> : <Badge tone="gold">Welcome</Badge>}
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              A church for every generation.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Worship with us, grow in faith through God&apos;s word, and find your place in our church family.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={isLive ? '/live' : '/sermons'}>
                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                  {isLive ? 'Watch live' : 'Watch sermons'}
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Plan a visit</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-panel border border-border bg-card p-6 shadow-soft dark:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
              {isLive ? 'Happening now' : 'Next gathering'}
            </p>
            {isLive ? (
              <>
                <p className="mt-2 text-xl font-semibold text-foreground">{live.data?.title || 'Live service'}</p>
                <Link href="/live" className="mt-4 inline-flex text-sm font-semibold text-link hover:underline">
                  Join the livestream →
                </Link>
              </>
            ) : nextEvent ? (
              <>
                <p className="mt-2 text-xl font-semibold text-foreground">{nextEvent.name}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {formatDate(nextEvent.event_date || nextEvent.eventDate)}
                </p>
                {nextEvent.location && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {nextEvent.location}
                  </p>
                )}
                <Link href={`/events/${nextEvent.id}`} className="mt-4 inline-flex text-sm font-semibold text-link hover:underline">
                  Event details →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-xl font-semibold text-foreground">Sunday worship</p>
                <p className="mt-3 text-sm text-muted">Everyone is welcome. See upcoming events for times and places.</p>
                <Link href="/events" className="mt-4 inline-flex text-sm font-semibold text-link hover:underline">
                  See events →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Today's devotional */}
      <TodayDevotionalCard wrapperClassName="container-max" />

      {/* 3. Hub tiles */}
      <div className="container-max">
        <Section title="Explore">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {hubLinks.map((link) => (
              <Tile
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                description={link.description}
                badge={link.href === '/live' && isLive ? <Badge tone="live">Live</Badge> : undefined}
              />
            ))}
          </div>
        </Section>
      </div>

      {/* 4. Upcoming events */}
      <div className="container-max">
        <Section title="Upcoming events" href="/events">
          {events.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : events.isError ? (
            <EmptyState icon={CalendarDays} title="Events couldn't load right now" message="Please try again in a moment." />
          ) : !events.data || events.data.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming events yet" message="New gatherings will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {events.data.slice(0, 3).map((event: any) => {
                const date = eventDateOf(event);
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <span className="text-[11px] font-semibold uppercase">
                        {date.toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{event.name}</span>
                      <span className="mt-1 block truncate text-sm text-muted">{event.location || 'Location to be announced'}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* 5. Latest sermons */}
      <div className="container-max">
        <Section title="Latest sermons" href="/sermons">
          {sermons.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : sermons.isError ? (
            <EmptyState icon={PlayCircle} title="Sermons couldn't load right now" message="Please try again in a moment." />
          ) : !sermons.data || sermons.data.length === 0 ? (
            <EmptyState icon={PlayCircle} title="No sermons yet" message="Recorded sermons will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {sermons.data.slice(0, 3).map((sermon: any) => (
                <Link
                  key={sermon.id}
                  href={`/sermons/${sermon.id}`}
                  className="group flex flex-col overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-primary/40"
                >
                  <span className="flex h-36 items-center justify-center bg-surface">
                    <PlayCircle className="h-12 w-12 text-primary transition-transform group-hover:scale-105" aria-hidden="true" />
                  </span>
                  <span className="space-y-1 p-4">
                    <span className="line-clamp-2 block font-semibold text-foreground">{sermon.title}</span>
                    <span className="block text-sm text-muted">{sermon.speaker || APP_NAME}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* 6. News */}
      <div className="container-max">
        <Section title="News & announcements" href="/news">
          {news.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : news.isError ? (
            <EmptyState icon={Newspaper} title="News couldn't load right now" message="Please try again in a moment." />
          ) : !news.data || news.data.length === 0 ? (
            <EmptyState icon={Newspaper} title="No announcements yet" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {news.data.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="flex h-full flex-col rounded-card border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <span className="line-clamp-2 font-semibold text-foreground">{post.title}</span>
                  <span className="mt-2 line-clamp-3 text-sm text-muted">{post.summary || post.excerpt || ''}</span>
                  <span className="mt-auto pt-4 text-xs text-muted">
                    {post.published_at ? formatDate(post.published_at) : 'Recently published'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* 7. Join (signed-out visitors only) */}
      {!isAuthenticated && (
        <div className="container-max">
          <div className="rounded-panel bg-primary px-6 py-10 text-center text-primary-foreground sm:px-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Become part of the family</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Create an account to join groups, register for events, track your giving and get updates.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 border-transparent">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
