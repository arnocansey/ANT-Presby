'use client';

import React from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveStream } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function LivePage() {
  const { data: live, isLoading, isError } = useLiveStream(60_000);

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader eyebrow="Watch" title="Livestream" description="Join our services live on YouTube or Facebook." />

      {isLoading ? (
        <Skeleton className="aspect-video w-full rounded-panel" />
      ) : isError && !live ? (
        <EmptyState icon={Radio} title="The livestream couldn't load right now" message="Please try again in a moment." />
      ) : !live?.is_live ? (
        <EmptyState
          icon={Radio}
          title="We're not live right now"
          message="When a service is streaming, it will appear here."
          action={
            <Button asChild variant="secondary">
              <Link href="/sermons">Watch past sermons</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="live">Live</Badge>
            <h2 className="min-w-0 break-words text-xl font-semibold text-foreground">{live.title || 'Livestream'}</h2>
          </div>
          {live.started_at && <p className="text-sm text-muted">Started {formatDateTime(live.started_at)}</p>}

          {live.youtube_embed_url && (
            <div className="aspect-video w-full overflow-hidden rounded-panel bg-black">
              <iframe
                src={live.youtube_embed_url}
                title={live.title || 'Livestream'}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {live.youtube_url && (
              <Button asChild>
                <a href={live.youtube_url} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube
                </a>
              </Button>
            )}
            {live.facebook_url && (
              <Button asChild variant="secondary">
                <a href={live.facebook_url} target="_blank" rel="noopener noreferrer">
                  Watch on Facebook
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
