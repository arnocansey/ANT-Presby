'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import RouteGuard from '@/components/auth/RouteGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  usePrayerRequests,
  usePrayerWall,
  usePrayForRequest,
  useSetPrayerSharing,
  type WallPrayer,
} from '@/hooks/useApi';
import { cn, formatDateTime } from '@/lib/utils';

const CATEGORIES = ['all', 'personal', 'family', 'health', 'work', 'financial', 'other'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

function PrayerCard({ prayer }: { prayer: WallPrayer }) {
  const pray = usePrayForRequest();
  const prayed = prayer.prayed_by_me;

  return (
    <Card className="rounded-[1.5rem] border-slate-200 shadow-sm dark:border-slate-800">
      <CardContent className="space-y-3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900 dark:text-slate-50">{prayer.requester_name}</p>
            <p className="text-xs text-ui-subtle">{formatDateTime(prayer.created_at)}</p>
          </div>
          <div className="flex gap-2">
            {prayer.status === 'answered' && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                Answered
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {prayer.category}
            </span>
          </div>
        </div>

        <h2 className="text-lg font-bold tracking-tight">{prayer.title}</h2>
        <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{prayer.description}</p>

        <Button
          type="button"
          variant={prayed ? 'outline' : 'default'}
          disabled={prayed || pray.isPending}
          onClick={() => pray.mutate(prayer.id)}
          aria-pressed={prayed}
        >
          <Heart className={cn('mr-2 h-4 w-4', prayed && 'fill-current')} />
          {prayed ? 'You prayed' : 'I prayed'} · {prayer.prayer_count}
        </Button>
      </CardContent>
    </Card>
  );
}

type OwnPrayer = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  share_on_wall?: boolean;
  prayer_count?: number;
};

// The member's own requests, with a switch to put each on or take it off the wall.
function MyRequests() {
  const { data, isLoading } = usePrayerRequests();
  const setSharing = useSetPrayerSharing();
  const requests = (Array.isArray(data) ? data : []) as OwnPrayer[];

  if (isLoading || requests.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold tracking-tight">My requests</h2>
      <div className="space-y-3">
        {requests.map((prayer) => (
          <Card key={prayer.id} className="border-slate-200 dark:border-slate-800">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-semibold">{prayer.title}</p>
                <p className="text-xs capitalize text-ui-subtle">
                  {prayer.status}
                  {' · '}
                  {prayer.share_on_wall
                    ? prayer.status === 'pending'
                      ? 'will appear on the wall after approval'
                      : `on the wall · ${prayer.prayer_count ?? 0} prayed`
                    : 'private'}
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={setSharing.isPending}
                onClick={() =>
                  setSharing.mutate({
                    id: prayer.id,
                    title: prayer.title,
                    description: prayer.description,
                    category: prayer.category,
                    shareOnWall: !prayer.share_on_wall,
                  })
                }
              >
                {prayer.share_on_wall ? 'Stop sharing' : 'Share on wall'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function PrayerWallContent() {
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [page, setPage] = React.useState(1);
  const { data, isLoading, error } = usePrayerWall({
    page,
    category: category === 'all' ? undefined : category,
  });

  const prayers = data?.data ?? [];
  const hasMore = Boolean(data?.meta?.has_more);

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Prayer Wall</h1>
          <p className="mt-2 text-sm italic text-ui-subtle">
            &quot;Pray for each other so that you may be healed.&quot; — James 5:16
          </p>
        </div>
        <div className="flex gap-3">
          <label htmlFor="wall-category" className="sr-only">
            Category
          </label>
          <select
            id="wall-category"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as CategoryFilter);
              setPage(1);
            }}
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm capitalize dark:border-slate-700 dark:bg-slate-950"
          >
            {CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {value === 'all' ? 'All categories' : value}
              </option>
            ))}
          </select>
          <Button asChild>
            <Link href="/prayer/new">Share a request</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading the prayer wall...</p>
      ) : error ? (
        <p className="text-sm text-red-700 dark:text-red-300">Could not load the prayer wall.</p>
      ) : prayers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-ui-subtle">
            No prayer requests here yet. Requests appear once their owner chooses to share them and they are
            approved.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-center gap-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="outline" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <MyRequests />
    </div>
  );
}

export default function PrayerWallPage() {
  return (
    <RouteGuard>
      <PrayerWallContent />
    </RouteGuard>
  );
}
