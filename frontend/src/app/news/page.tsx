'use client';

import React from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import SearchField from '@/components/site/SearchField';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { useNews } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';

export default function NewsPage() {
  const [search, setSearch] = React.useState('');
  const { data, isLoading, error } = useNews(1, 18, search || undefined);
  const posts = data?.data || [];

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="News & announcements"
        title="Stay in step with the latest updates"
        description="Announcements, stories and updates from the church."
      />

      <SearchField
        label="Search news"
        placeholder="Search news and announcements"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <SkeletonGrid count={6} className="md:grid-cols-2 lg:grid-cols-3" />
      ) : error ? (
        <EmptyState icon={Newspaper} title="News couldn't load right now" message="Please try again in a moment." />
      ) : posts.length === 0 ? (
        search ? (
          <EmptyState
            icon={Newspaper}
            title="No announcements match your search"
            message="Try a different word."
            action={
              <Button variant="secondary" onClick={() => setSearch('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Newspaper} title="No announcements yet" message="News and updates will appear here." />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/news/${post.id}`}
              className="group flex h-full flex-col rounded-card border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Update</span>
              <span className="mt-2 line-clamp-2 text-lg font-semibold text-foreground group-hover:underline">{post.title}</span>
              <span className="mt-2 line-clamp-3 text-sm text-foreground/85">
                {post.summary || post.excerpt || post.content || 'Open this post to read the full update.'}
              </span>
              <span className="mt-auto pt-4 text-xs text-muted">
                {post.published_at ? formatDate(post.published_at) : 'Published update'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
