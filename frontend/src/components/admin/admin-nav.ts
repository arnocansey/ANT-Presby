import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  BellRing,
  BookOpenText,
  CalendarDays,
  Church,
  ClipboardCheck,
  HeartHandshake,
  History,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  Radio,
  Settings,
  Users,
  UsersRound,
} from 'lucide-react';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Other route prefixes that also highlight this item. */
  also?: string[];
};

export type AdminNavGroup = { title: string; items: AdminNavItem[] };

// Spec §3.3: five groups. Routes are unchanged; only the grouping and labels are new.
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/audit', label: 'Activity log', icon: History },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/sermons', label: 'Sermons & series', icon: Megaphone, also: ['/admin/series'] },
      { href: '/admin/devotionals', label: 'Devotionals', icon: BookOpenText },
      { href: '/admin/news', label: 'News', icon: Newspaper },
      { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
      { href: '/admin/announcements', label: 'Announcements', icon: BellRing },
      { href: '/admin/live', label: 'Livestream', icon: Radio },
    ],
  },
  {
    title: 'Church life',
    items: [
      { href: '/admin/events', label: 'Events', icon: CalendarDays },
      { href: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
      { href: '/admin/ministries', label: 'Ministries', icon: Church },
      { href: '/admin/groups', label: 'Small groups', icon: UsersRound },
      { href: '/admin/prayers', label: 'Prayer requests', icon: HeartHandshake },
    ],
  },
  {
    title: 'People & giving',
    items: [
      { href: '/admin/users', label: 'Members', icon: Users },
      { href: '/admin/donations', label: 'Donations', icon: Banknote },
    ],
  },
  {
    title: 'Settings',
    items: [{ href: '/admin/settings', label: 'Settings', icon: Settings }],
  },
];

const matchesPrefix = (base: string, pathname: string) => pathname === base || pathname.startsWith(`${base}/`);

export const isAdminNavActive = (item: AdminNavItem, pathname: string) =>
  [item.href, ...(item.also ?? [])].some((base) => matchesPrefix(base, pathname));

export const findAdminNavItem = (pathname: string) =>
  ADMIN_NAV.flatMap((group) => group.items).find((item) => isAdminNavActive(item, pathname));

// Ruling 1: Sermons and Series share one sidebar item and switch with these tabs.
export const SERMON_TABS = [
  { href: '/admin/sermons', label: 'Sermons' },
  { href: '/admin/series', label: 'Series' },
];

export const ADMIN_HOME_CRUMB = { label: 'Admin', href: '/admin/dashboard' } as const;
