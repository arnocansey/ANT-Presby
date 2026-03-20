'use client';

import React from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useNewsPost } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveAssetUrl } from '@/lib/utils';

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useNewsPost(id);

  return (
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight sm:text-3xl">{data?.title || 'News'}</CardTitle>
          {data?.published_at && (
            <p className="text-sm text-ui-subtle">{new Date(data.published_at).toLocaleDateString()}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoading && <p className="text-ui-subtle">Loading...</p>}
          {!isLoading && error && <p className="text-sm font-medium text-red-700 dark:text-red-300">Failed to load news post.</p>}
          {!isLoading && !error && !data && <p className="text-ui-subtle">News post not found.</p>}

          {data?.image_url && (
            <Image
              src={resolveAssetUrl(data.image_url)}
              alt={data.title}
              width={1280}
              height={720}
              unoptimized
              className="max-h-[360px] w-full rounded-xl border border-slate-200 object-cover dark:border-slate-700"
            />
          )}
          {data?.summary && <p className="text-base font-medium text-ui-muted">{data.summary}</p>}
          {data?.content && (
            <div className="whitespace-pre-wrap leading-relaxed text-ui-muted">{data.content}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
