'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Accessible tabs: one tab in the Tab order (roving tabindex), arrow keys / Home / End move between tabs.
// Pass `id` to link each tab to its panel: the panel should use id={`${id}-panel-${value}`}.
export default function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
  id,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  id?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  const move = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') move(index + 1);
    else if (event.key === 'ArrowLeft') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(tabs.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-border', className)}>
      {tabs.map((tab, index) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            id={id ? `${id}-tab-${tab.value}` : undefined}
            aria-selected={active}
            aria-controls={id ? `${id}-panel-${tab.value}` : undefined}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(tab.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
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
