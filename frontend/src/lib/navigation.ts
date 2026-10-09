import type { LucideIcon } from 'lucide-react';
import {
  BookOpenText,
  CalendarDays,
  Church,
  Gift,
  HeartHandshake,
  Home,
  ImageIcon,
  Info,
  LayoutDashboard,
  Newspaper,
  PlayCircle,
  Radio,
  Users,
  UsersRound,
} from 'lucide-react';

export type NavLink = { href: string; label: string; icon: LucideIcon; description?: string };

// Header links (spec §3.1): a few top links; everything else lives on the Home hub.
export const PRIMARY_NAV: NavLink[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/sermons', label: 'Watch', icon: PlayCircle },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/about', label: 'About', icon: Info },
];

export const GIVE_LINK: NavLink = { href: '/donate', label: 'Give', icon: Gift };

export const HUB_LINKS: NavLink[] = [
  { href: '/live', label: 'Live', icon: Radio, description: 'Join the service online' },
  { href: '/devotionals', label: 'Devotional', icon: BookOpenText, description: "Today's reading and reflection" },
  { href: '/groups', label: 'Small groups', icon: UsersRound, description: 'Find a group near you' },
  { href: '/prayer/wall', label: 'Prayer wall', icon: HeartHandshake, description: 'Pray with the church' },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon, description: 'Photos from church life' },
  { href: '/news', label: 'News', icon: Newspaper, description: 'Announcements and updates' },
  { href: '/community', label: 'Community', icon: Users, description: 'Share and encourage' },
  { href: '/ministries', label: 'Ministries', icon: Church, description: 'Serve and belong' },
];

export const MEMBER_HUB_LINK: NavLink = {
  href: '/dashboard',
  label: 'My dashboard',
  icon: LayoutDashboard,
  description: 'Registrations, giving and groups',
};

export const FOOTER_GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Watch & read',
    links: [
      { href: '/sermons', label: 'Sermons' },
      { href: '/live', label: 'Live' },
      { href: '/devotionals', label: 'Devotionals' },
      { href: '/news', label: 'News' },
    ],
  },
  {
    title: 'Get involved',
    links: [
      { href: '/events', label: 'Events' },
      { href: '/groups', label: 'Small groups' },
      { href: '/prayer/wall', label: 'Prayer wall' },
      { href: '/community', label: 'Community' },
      { href: '/ministries', label: 'Ministries' },
      { href: '/gallery', label: 'Gallery' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/about', label: 'Our church' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

export const isActivePath = (pathname: string | null, href: string) => {
  const path = pathname || '/';
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
};
