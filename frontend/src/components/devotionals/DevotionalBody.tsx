import Scripture from '@/components/ui/scripture';
import type { Devotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function DevotionalBody({
  devotional,
  headingLevel = 'h2',
}: {
  devotional: Devotional;
  headingLevel?: 'h1' | 'h2';
}) {
  const Heading = headingLevel;
  return (
    <article className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
          {devotional.is_today === false ? `Devotional · ${formatDateOnly(devotional.publish_date)}` : formatDateOnly(devotional.publish_date)}
        </p>
        <Heading className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{devotional.title}</Heading>
      </header>
      <Scripture reference={devotional.scripture_reference}>
        <span className="whitespace-pre-line">{devotional.scripture_text}</span>
      </Scripture>
      <div className="whitespace-pre-line text-base leading-relaxed text-foreground">{devotional.body}</div>
      {devotional.prayer && (
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Prayer</p>
          <p className="whitespace-pre-line font-serif text-lg italic text-foreground">{devotional.prayer}</p>
        </div>
      )}
    </article>
  );
}
