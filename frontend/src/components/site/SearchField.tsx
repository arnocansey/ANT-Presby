'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

// Text input with a leading search icon. `label` is the accessible name.
export default function SearchField({ label, className, ...props }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <Input aria-label={label} className="pl-10" {...props} />
    </div>
  );
}
