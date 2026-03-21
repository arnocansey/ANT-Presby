'use client';

import React from 'react';
import Link from 'next/link';
import { Newspaper, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNews } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';

export default function NewsPage() {
  const [search, setSearch] = React.useState('');
  const { data, isLoading, error } = useNews(1, 18, search || undefined);
  const posts = data?.data || [];

  return (
    <div className="container-max py-10">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
          News & Announcements
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          Stay in step with the latest updates
        </h1>
        <p className="mt-3 text-ui-subtle">
          Read live announcements and published updates from the real ANT PRESS news flow.
        </p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search news and announcements..."
          className="h-12 rounded-xl border-slate-200 bg-white pl-10 dark:border-slate-800 dark:bg-slate-950"
        />
      </div>

      {isLoading && <NewsState text="Loading news..." />}
      {!isLoading && error && <NewsState text="Failed to load news." />}
      {!isLoading && !error && posts.length === 0 && (
        <NewsState text="No announcements available right now." />
      )}

      {!isLoading && !error && posts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any, index: number) => (
            <Link key={post.id} href={`/news/${post.id}`} className="group block">
              <article className="h-full overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
                <div className={`h-40 bg-gradient-to-br ${index % 3 === 0 ? 'from-orange-500 to-amber-500' : index % 3 === 1 ? 'from-indigo-600 to-purple-600' : 'from-sky-600 to-cyan-600'}`} />
                <div className="space-y-3 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">
                    Published Update
                  </p>
                  <h2 className="line-clamp-2 text-xl font-bold tracking-tight text-slate-950 group-hover:text-sky-700 dark:text-white dark:group-hover:text-cyan-300">
                    {post.title}
                  </h2>
                  <p className="line-clamp-3 text-sm text-ui-muted">
                    {post.summary || post.excerpt || post.content || 'Open this post to read the full update.'}
                  </p>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {post.published_at ? formatDate(post.published_at) : 'Published update'}
                  </p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewsState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-10 text-center text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      <Newspaper className="mx-auto mb-4 h-10 w-10 opacity-30" />
      <p>{text}</p>
    </div>
  );
}
