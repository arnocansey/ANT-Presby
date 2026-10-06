'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { useTodayDevotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function TodayDevotionalCard() {
  const { data: devotional, isLoading } = useTodayDevotional();

  if (isLoading || !devotional) {
    return null;
  }

  return (
    <Link
      href={`/devotionals/${devotional.id}`}
      className="block rounded-[1.5rem] border border-amber-200 bg-amber-50 p-6 transition-colors hover:border-amber-300 dark:border-amber-900/50 dark:bg-amber-950/30"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
        <BookOpen className="h-4 w-4" />
        {devotional.is_today ? "Today's devotional" : `Devotional · ${formatDateOnly(devotional.publish_date)}`}
      </p>
      <h2 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{devotional.title}</h2>
      <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{devotional.scripture_reference}</p>
      <p className="mt-2 line-clamp-2 text-sm italic text-slate-600 dark:text-slate-400">{devotional.scripture_text}</p>
    </Link>
  );
}
