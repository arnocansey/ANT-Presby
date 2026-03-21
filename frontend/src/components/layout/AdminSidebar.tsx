'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, DollarSign, Heart, History, Home, Megaphone, Newspaper, Settings, UserRoundCog, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/sermons', label: 'Sermons', icon: Megaphone },
  { href: '/admin/events', label: 'Events', icon: Calendar },
  { href: '/admin/ministries', label: 'Ministries', icon: UserRoundCog },
  { href: '/admin/news', label: 'News', icon: Newspaper },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/prayers', label: 'Prayer Requests', icon: Heart },
  { href: '/admin/donations', label: 'Donations', icon: DollarSign },
  { href: '/admin/audit', label: 'Audit Log', icon: History },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

type AdminSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export default function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn('w-72 border-r border-slate-200/80 bg-white/90 p-5 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80', className)}>
      <div className="mb-7">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">Admin</h2>
        <p className="mt-1 text-xs text-ui-subtle">Manage publishing and operations</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200 dark:bg-cyan-950/40 dark:text-cyan-200 dark:ring-cyan-900'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link
            href="/admin/ministries/new"
            onClick={onNavigate}
            className="block rounded-lg bg-amber-500 px-3 py-2.5 text-center text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
          >
            New Ministry
          </Link>
          <Link
            href="/admin/sermons/new"
            onClick={onNavigate}
            className="block rounded-lg bg-sky-700 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-sky-800 dark:bg-sky-600 dark:hover:bg-sky-500"
          >
            New Sermon
          </Link>
          <Link
            href="/admin/events/new"
            onClick={onNavigate}
            className="block rounded-lg bg-emerald-700 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            New Event
          </Link>
        </div>
      </nav>
    </aside>
  );
}
