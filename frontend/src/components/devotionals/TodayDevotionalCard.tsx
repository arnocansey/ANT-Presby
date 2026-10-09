'use client';

import Link from 'next/link';
import { ArrowRight, BookOpenText } from 'lucide-react';
import Scripture from '@/components/ui/scripture';
import { useTodayDevotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function TodayDevotionalCard() {
  const { data: devotional, isLoading, isError } = useTodayDevotional();

  if (isLoading || isError || !devotional) {
    return null;
  }

  return (
    <Link
      href={`/devotionals/${devotional.id}`}
      className="group block rounded-panel border border-border bg-gold-soft/60 p-6 transition-colors hover:border-gold sm:p-8"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
        <BookOpenText className="h-4 w-4" aria-hidden="true" />
        {devotional.is_today ? "Today's devotional" : `Devotional · ${formatDateOnly(devotional.publish_date)}`}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">{devotional.title}</h2>
      <Scripture reference={devotional.scripture_reference} className="mt-4">
        <span className="line-clamp-3">{devotional.scripture_text}</span>
      </Scripture>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-link group-hover:underline">
        Read today&apos;s reflection <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
