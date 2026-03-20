'use client';

import React from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { cn } from '@/lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ui-subtle">Admin</p>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Control Center</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            onClick={() => setIsMobileNavOpen((value) => !value)}
            aria-expanded={isMobileNavOpen}
            aria-controls="admin-mobile-nav"
          >
            {isMobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            Menu
          </button>
        </div>

        <div
          className={cn(
            'fixed inset-0 z-40 bg-slate-950/50 transition-opacity lg:hidden',
            isMobileNavOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
          )}
          onClick={() => setIsMobileNavOpen(false)}
        />

        <AdminSidebar className="hidden shrink-0 lg:block" />

        <div
          id="admin-mobile-nav"
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] -translate-x-full transition-transform lg:hidden',
            isMobileNavOpen && 'translate-x-0'
          )}
        >
          <AdminSidebar onNavigate={() => setIsMobileNavOpen(false)} className="h-full border-r shadow-xl" />
        </div>

        <main className="flex-1 bg-gradient-to-b from-white to-slate-50 p-4 dark:from-slate-950 dark:to-slate-900/60 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center justify-end lg:hidden">
              <Link href="/" className="text-sm font-semibold text-sky-700 hover:underline dark:text-cyan-300">
                Back to site
              </Link>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
