import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Section({
  title,
  href,
  linkLabel = 'See all',
  className,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
            {linkLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
