'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ADMIN_NAV, isAdminNavActive } from '@/components/admin/admin-nav';
import { cn } from '@/lib/utils';

type AdminSidebarProps = {
  className?: string;
  /** Desktop only: icons only, labels kept for screen readers and tooltips. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Called when a link is followed (the phone drawer closes itself with it). */
  onNavigate?: () => void;
};

const itemClass =
  'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function AdminSidebar({ className, collapsed = false, onToggleCollapse, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname() ?? '';

  return (
    <aside aria-label="Admin" className={cn('flex flex-col bg-surface', className)}>
      <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group, index) => (
          <div key={group.title} role="group" aria-label={group.title} className={cn(index > 0 && 'mt-5')}>
            {collapsed ? (
              index > 0 && <div className="mx-2 mb-3 border-t border-border" aria-hidden="true" />
            ) : (
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted" aria-hidden="true">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isAdminNavActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        itemClass,
                        collapsed && 'justify-center px-0',
                        active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-background'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? 'Back to site' : undefined}
          className={cn(itemClass, 'text-link hover:bg-background', collapsed && 'justify-center px-0')}
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className={cn(collapsed && 'sr-only')}>Back to site</span>
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : undefined}
            className={cn(itemClass, 'w-full text-muted hover:bg-background hover:text-foreground', collapsed && 'justify-center px-0')}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            <span className={cn(collapsed && 'sr-only')}>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
