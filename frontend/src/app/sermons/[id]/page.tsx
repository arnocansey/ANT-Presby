'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Mic, PlayCircle } from 'lucide-react';
import { useSermon } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SermonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useSermon(id);

  return (
    <div className="container-max py-12 sm:py-16">
      <Card className="overflow-hidden">
        <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
            <PlayCircle className="h-4 w-4" />
            Sermon Message
          </div>
          <CardTitle className="text-2xl tracking-tight sm:text-3xl">
            {data?.title || 'Sermon'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6 sm:p-8">
          {isLoading && (
            <div className="space-y-4">
              <div className="aspect-video animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
            </div>
          )}

          {!isLoading && error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              Failed to load sermon.
            </p>
          )}

          {!isLoading && !error && !data && (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-ui-subtle dark:border-slate-700">
              Sermon not found.
            </p>
          )}

          {data && (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm dark:border-slate-700">
                <div className="aspect-video">
                  <iframe
                    title={data.title}
                    src={data.video_url}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              </div>

              {data.speaker && (
                <p className="flex items-center gap-2 text-sm font-medium text-ui-muted">
                  <Mic className="h-4 w-4 text-sky-700 dark:text-cyan-300" />
                  {data.speaker}
                </p>
              )}

              {data.description && (
                <p className="leading-relaxed text-ui-muted">{data.description}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
