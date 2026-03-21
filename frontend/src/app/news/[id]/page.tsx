'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useNewsPost } from '@/hooks/useApi';
import { formatDate, resolveAssetUrl } from '@/lib/utils';

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useNewsPost(id);

  return (
    <div className="container-max py-10">
      <Link
        href="/news"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to news
      </Link>

      {isLoading && <DetailState text="Loading news post..." />}
      {!isLoading && error && <DetailState text="Failed to load news post." />}
      {!isLoading && !error && !data && <DetailState text="News post not found." />}

      {data && (
        <article className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {data.image_url ? (
            <Image
              src={resolveAssetUrl(data.image_url)}
              alt={data.title}
              width={1440}
              height={720}
              unoptimized
              className="max-h-[420px] w-full object-cover"
            />
          ) : (
            <div className="h-52 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 sm:h-72" />
          )}

          <div className="space-y-5 p-6 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-300">
              Published Update
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
              {data.title}
            </h1>
            <p className="text-sm uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              {data.published_at ? formatDate(data.published_at) : 'Published update'}
            </p>
            {(data.summary || data.excerpt) && (
              <p className="max-w-3xl text-lg leading-relaxed text-ui-muted">
                {data.summary || data.excerpt}
              </p>
            )}
            {data.content && (
              <div className="whitespace-pre-wrap leading-relaxed text-ui-muted">
                {data.content}
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

function DetailState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-10 text-center text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      <p>{text}</p>
    </div>
  );
}
