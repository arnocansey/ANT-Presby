'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, HeartHandshake } from 'lucide-react';
import RouteGuard from '@/components/auth/RouteGuard';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import Scripture from '@/components/ui/scripture';
import Section from '@/components/ui/section';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{prayer.requester_name}</p>
            <p className="text-xs text-muted">{formatDateTime(prayer.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {prayer.status === 'answered' && <Badge tone="success">Answered</Badge>}
            <Badge tone="neutral" className="capitalize">
              {prayer.category}
            </Badge>
          </div>
        </div>

        <h2 className="break-words text-lg font-semibold text-foreground">{prayer.title}</h2>
        <p className="whitespace-pre-line text-sm text-foreground/85">{prayer.description}</p>

        <div className="mt-auto pt-1">
          <Button
            type="button"
            variant={prayed ? 'secondary' : 'primary'}
            disabled={prayed || pray.isPending}
            onClick={() => pray.mutate(prayer.id)}
            aria-pressed={prayed}
          >
            <Heart className={cn('h-4 w-4', prayed && 'fill-current')} aria-hidden="true" />
            {prayed ? 'You prayed' : 'I prayed'} · {prayer.prayer_count}
          </Button>
        </div>
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
  const { data, isLoading, isError } = usePrayerRequests();
  const setSharing = useSetPrayerSharing();
  const requests = (Array.isArray(data) ? data : []) as OwnPrayer[];

  return (
    <Section title="My requests" href="/prayer/new" linkLabel="New request">
      {isLoading ? (
        <div className="space-y-3" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <EmptyState icon={HeartHandshake} title="Your requests couldn't load right now" message="Please try again in a moment." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="You haven't shared a request yet"
          message="Requests you submit appear here, and you choose whether each one goes on the wall."
          action={
            <Button asChild variant="secondary">
              <Link href="/prayer/new">Share a request</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((prayer) => (
            <Card key={prayer.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{prayer.title}</p>
                  <p className="text-xs capitalize text-muted">
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
                  variant="secondary"
                  className="self-start sm:self-auto"
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
      )}
    </Section>
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
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Prayer"
        title="Prayer wall"
        description="Pray for the requests members have chosen to share."
        actions={
          <>
            <div className="w-full sm:w-48">
              <Label htmlFor="wall-category" className="sr-only">
                Category
              </Label>
              <Select
                id="wall-category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as CategoryFilter);
                  setPage(1);
                }}
                className="capitalize"
              >
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {value === 'all' ? 'All categories' : value}
                  </option>
                ))}
              </Select>
            </div>
            <Button asChild>
              <Link href="/prayer/new">Share a request</Link>
            </Button>
          </>
        }
      />

      <Scripture reference="James 5:16">Pray for each other so that you may be healed.</Scripture>

      {isLoading ? (
        <SkeletonGrid count={4} className="md:grid-cols-2" />
      ) : error ? (
        <EmptyState icon={HeartHandshake} title="The prayer wall couldn't load right now" message="Please try again in a moment." />
      ) : prayers.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No prayer requests here yet"
          message="Requests appear once their owner chooses to share them and they are approved."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-center gap-3">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="secondary" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
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
