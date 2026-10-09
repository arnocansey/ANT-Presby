import * as React from 'react';
import { cn } from '@/lib/utils';

// Scripture and quotes: serif, with a gold rule.
export default function Scripture({
  children,
  reference,
  className,
}: {
  children: React.ReactNode;
  reference?: string;
  className?: string;
}) {
  return (
    <blockquote className={cn('border-l-[3px] border-gold pl-4', className)}>
      <p className="font-serif text-lg italic leading-relaxed text-foreground">{children}</p>
      {reference && <cite className="mt-2 block text-sm font-semibold not-italic text-muted">{reference}</cite>}
    </blockquote>
  );
}
