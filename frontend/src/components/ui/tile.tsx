import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export default function Tile({
  href,
  icon: Icon,
  label,
  description,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-3 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {badge}
      </div>
      <div>
        <p className="font-semibold text-foreground">{label}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
    </Link>
  );
}
