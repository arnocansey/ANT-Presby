'use client';

import React from 'react';
import Link from 'next/link';
import { useNews } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewsPage() {
  const { data, isLoading, error } = useNews(1, 12);
  const posts = data?.data || [];

  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">News & Announcements</h1>
        <p className="mt-2 max-w-2xl text-ui-subtle">
          Stay up to date with the latest church announcements and ministry updates.
        </p>
      </div>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-ui-subtle">Loading news...</CardContent>
        </Card>
      )}

      {!isLoading && error && (
        <Card className="border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-6 text-sm font-medium text-red-700 dark:text-red-300">
            Failed to load news.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-ui-subtle">No announcements available right now.</CardContent>
        </Card>
      )}

      {!isLoading && !error && posts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any) => (
            <Link key={post.id} href={`/news/${post.id}`} className="group block">
              <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="line-clamp-2 text-xl tracking-tight group-hover:text-sky-700 dark:group-hover:text-cyan-300">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-3 text-sm text-ui-muted">{post.summary}</p>
                  <p className="text-xs text-ui-subtle">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
