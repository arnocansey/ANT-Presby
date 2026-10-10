'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { useParams } from 'next/navigation';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsPost } from '@/hooks/useApi';
import { formatDate, resolveAssetUrl } from '@/lib/utils';

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useNewsPost(id);

  return (
    <div className="container-max py-10 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <BackLink href="/news" label="Back to news" />

        {isLoading && (
          <div className="space-y-4" role="status">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-56 w-full rounded-panel" />
          </div>
        )}
        {!isLoading && error && (
          <EmptyState icon={Newspaper} title="This post couldn't load right now" message="Please try again in a moment." />
        )}
        {!isLoading && !error && !data && (
          <EmptyState
            icon={Newspaper}
            title="News post not found"
            message="It may have been moved or removed."
            action={
              <Button asChild variant="secondary">
                <Link href="/news">All news</Link>
              </Button>
            }
          />
        )}

        {data && (
          <article className="space-y-6">
            <header className="space-y-3 border-b border-border pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">News</p>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{data.title}</h1>
              <p className="text-sm text-muted">{data.published_at ? formatDate(data.published_at) : 'Published update'}</p>
            </header>
            {data.image_url && (
              <Image
                src={resolveAssetUrl(data.image_url)}
                alt={data.title}
                width={1440}
                height={720}
                unoptimized
                className="max-h-[420px] w-full rounded-panel object-cover"
              />
            )}
            {(data.summary || data.excerpt) && (
              <p className="text-lg leading-relaxed text-foreground/85">{data.summary || data.excerpt}</p>
            )}
            {data.content && <div className="whitespace-pre-wrap leading-relaxed text-foreground">{data.content}</div>}
          </article>
        )}
      </div>
    </div>
  );
}
