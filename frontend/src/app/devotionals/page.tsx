'use client';

import React from 'react';
import Link from 'next/link';
import DevotionalBody from '@/components/devotionals/DevotionalBody';
import { Button } from '@/components/ui/button';
import { useDevotionalArchive, useTodayDevotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function DevotionalsPage() {
  const [page, setPage] = React.useState(1);
  const { data: today, isLoading: todayLoading } = useTodayDevotional();
  const { data: archive, isLoading: archiveLoading } = useDevotionalArchive(page);

  return (
    <div className="container-max space-y-10 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Daily Devotional</h1>
        <p className="mt-2 text-sm text-ui-subtle">Scripture, a short reflection and a prayer for each day.</p>
      </div>

      {todayLoading ? (
        <p className="text-sm text-ui-subtle">Loading today&apos;s devotional...</p>
      ) : today ? (
        <DevotionalBody devotional={today} />
      ) : (
        <p className="text-sm text-ui-subtle">No devotional has been published yet.</p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Earlier devotionals</h2>
        {archiveLoading ? (
          <p className="text-sm text-ui-subtle">Loading...</p>
        ) : (archive?.data ?? []).length === 0 ? (
          <p className="text-sm text-ui-subtle">Nothing here yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
            {(archive?.data ?? []).map((item) => (
              <li key={item.id}>
                <Link href={`/devotionals/${item.id}`} className="flex justify-between gap-3 py-3 hover:text-sky-700 dark:hover:text-cyan-300">
                  <span className="truncate font-medium">{item.title}</span>
                  <span className="shrink-0 text-sm text-ui-subtle">{formatDateOnly(item.publish_date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {(page > 1 || archive?.hasMore) && (
          <div className="flex gap-3">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Newer
            </Button>
            <Button variant="outline" disabled={!archive?.hasMore} onClick={() => setPage((p) => p + 1)}>
              Older
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
