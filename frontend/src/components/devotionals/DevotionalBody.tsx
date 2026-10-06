import type { Devotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function DevotionalBody({ devotional }: { devotional: Devotional }) {
  return (
    <article className="space-y-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
          {devotional.is_today === false ? `Devotional · ${formatDateOnly(devotional.publish_date)}` : formatDateOnly(devotional.publish_date)}
        </p>
        <h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{devotional.title}</h2>
      </header>
      <blockquote className="rounded-2xl border-l-4 border-amber-400 bg-amber-50 p-5 dark:bg-amber-950/30">
        <p className="whitespace-pre-line italic">{devotional.scripture_text}</p>
        <footer className="mt-2 text-sm font-semibold">{devotional.scripture_reference}</footer>
      </blockquote>
      <div className="max-w-3xl whitespace-pre-line leading-relaxed">{devotional.body}</div>
      {devotional.prayer && (
        <div className="rounded-2xl bg-slate-100 p-5 dark:bg-slate-900">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-ui-subtle">Prayer</p>
          <p className="whitespace-pre-line">{devotional.prayer}</p>
        </div>
      )}
    </article>
  );
}
