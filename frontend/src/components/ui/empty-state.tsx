import * as React from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-input bg-surface/50 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
      {action}
    </div>
  );
}
