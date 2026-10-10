'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Underline tabs like the 8a Tabs component, but each tab is a page link.
export default function AdminSubNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname() ?? '';
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px inline-flex h-11 items-center whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
