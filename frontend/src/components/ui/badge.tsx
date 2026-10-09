import * as React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-surface text-muted border border-border',
  gold: 'bg-gold-soft text-gold-ink',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  live: 'bg-danger-solid text-danger-solid-foreground',
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone], className)}>
      {tone === 'live' ? (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export default Badge;
