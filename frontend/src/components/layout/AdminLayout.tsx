'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { findAdminNavItem } from '@/components/admin/admin-nav';
import { cn } from '@/lib/utils';

const COLLAPSE_KEY = 'admin-sidebar-collapsed';
const DESKTOP_QUERY = '(min-width: 1024px)';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const current = findAdminNavItem(pathname);
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Read the saved collapse choice after mount, so server and first client render match.
  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // Storage blocked (private mode): stay expanded.
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      // Not remembered; still works for this visit.
    }
  };

  // Any navigation closes the drawer.
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // The drawer is a modal dialog: focus moves in, Tab stays inside, Escape closes it, the page
  // behind doesn't scroll, focus returns to Menu on close, and widening to desktop closes it.
  React.useEffect(() => {
    if (!drawerOpen) return undefined;
    const trigger = menuButtonRef.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onDesktop);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onDesktop);
      trigger?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="bg-background text-foreground">
      {/* Phones and tablets: a bar under the site header (h-16) that opens the admin drawer. */}
      <div className="sticky top-[65px] z-30 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2 lg:hidden">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Admin</p>
          <p className="truncate text-sm font-semibold text-foreground">{current?.label ?? 'Admin'}</p>
        </div>
        <Button
          ref={menuButtonRef}
          variant="secondary"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls="admin-drawer"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          Menu
        </Button>
      </div>

      <div className="flex">
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          className={cn(
            'sticky top-[65px] hidden h-[calc(100vh-65px)] shrink-0 border-r border-border lg:flex',
            collapsed ? 'w-[4.5rem]' : 'w-64'
          )}
        />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>

      {/* Rendered into <body> so no ancestor (the site header's blur, sticky bars) can clip it. */}
      {drawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close admin menu"
              className="absolute inset-0 bg-foreground/40 animate-fade-in"
              onClick={() => setDrawerOpen(false)}
            />
            <div
              ref={panelRef}
              id="admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Admin menu"
              className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-surface shadow-xl animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <p className="text-sm font-semibold text-foreground">Admin menu</p>
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close admin menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <AdminSidebar onNavigate={() => setDrawerOpen(false)} className="min-h-0 flex-1" />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
