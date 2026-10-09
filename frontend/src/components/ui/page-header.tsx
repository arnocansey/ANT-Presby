import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Crumb = { label: string; href?: string };

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  breadcrumb?: Crumb[];
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-2">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-base text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
