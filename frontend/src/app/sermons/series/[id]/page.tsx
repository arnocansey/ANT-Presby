'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Play } from 'lucide-react';
import { useSermonSeries } from '@/hooks/useApi';
import { formatDateOnly, resolveAssetUrl } from '@/lib/utils';

export default function SermonSeriesPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const validId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { data: series, isLoading, error } = useSermonSeries(validId);

  const dateRange = series
    ? [formatDateOnly(series.start_date), formatDateOnly(series.end_date)].filter(Boolean).join(' – ')
    : '';

  return (
    <div className="container-max space-y-8 py-10">
      <Link href="/sermons" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 dark:text-cyan-300">
        <ArrowLeft className="h-4 w-4" /> All sermons
      </Link>

      {!validId || error ? (
        <p className="text-ui-subtle">This series could not be found.</p>
      ) : isLoading || !series ? (
        <p className="text-ui-subtle">Loading series...</p>
      ) : (
        <>
          <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {series.cover_image_url && (
              <Image
                src={resolveAssetUrl(series.cover_image_url)}
                alt={series.title}
                width={240}
                height={135}
                unoptimized
                className="h-auto w-full max-w-[240px] rounded-[1.2rem] object-cover"
              />
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">
                Sermon series
              </p>
              <h1 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{series.title}</h1>
              {dateRange && <p className="mt-1 text-sm text-ui-subtle">{dateRange}</p>}
              {series.description && (
                <p className="mt-3 max-w-2xl whitespace-pre-line text-slate-700 dark:text-slate-300">
                  {series.description}
                </p>
              )}
            </div>
          </header>

          {series.sermons.length === 0 ? (
            <p className="text-ui-subtle">No sermons in this series yet.</p>
          ) : (
            <ol className="space-y-3">
              {series.sermons.map((sermon, index) => (
                <li key={sermon.id}>
                  <Link
                    href={`/sermons/${sermon.id}`}
                    className="flex items-center gap-4 rounded-[1.2rem] border border-slate-200 bg-white p-4 transition-colors hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-800 dark:bg-cyan-950 dark:text-cyan-200">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-950 dark:text-white">{sermon.title}</p>
                      <p className="text-sm text-ui-subtle">
                        {sermon.speaker} · {formatDateOnly(sermon.sermon_date)}
                      </p>
                    </div>
                    <Play className="h-5 w-5 shrink-0 text-sky-700 dark:text-cyan-300" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
