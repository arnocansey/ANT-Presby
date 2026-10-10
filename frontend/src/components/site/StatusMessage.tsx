import * as React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONES = {
  success: { className: 'border-success/30 bg-success/10 text-success', Icon: CheckCircle2 },
  danger: { className: 'border-danger/30 bg-danger/10 text-danger', Icon: AlertCircle },
  info: { className: 'border-border bg-surface text-muted', Icon: Info },
} as const;

// Form-level result message (saved, failed, verifying…). Icon plus text, never colour alone.
export default function StatusMessage({
  tone = 'info',
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  const { className: toneClass, Icon } = TONES[tone];
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm font-medium', toneClass, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
