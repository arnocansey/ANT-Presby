'use client';

import { cn } from '@/lib/utils';

export default function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-border', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition-colors',
              active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
