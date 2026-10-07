'use client';

import React from 'react';
import { Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveStream } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function LivePage() {
  const { data: live, isLoading } = useLiveStream(60_000);

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Livestream</h1>
        <p className="mt-2 text-sm text-ui-subtle">Join our services live on YouTube or Facebook.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading...</p>
      ) : !live?.is_live ? (
        <div className="rounded-xl border border-slate-200 p-8 text-center dark:border-slate-800">
          <p className="text-lg font-semibold">We&apos;re not live right now</p>
          <p className="mt-2 text-sm text-ui-subtle">When a service is streaming, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              <Radio className="h-3.5 w-3.5" aria-hidden="true" />
              Live
            </span>
            <h2 className="text-xl font-bold">{live.title || 'Livestream'}</h2>
          </div>
          {live.started_at && <p className="text-sm text-ui-subtle">Started {formatDateTime(live.started_at)}</p>}

          {live.youtube_embed_url && (
            <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
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
              <Button asChild variant="outline">
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
