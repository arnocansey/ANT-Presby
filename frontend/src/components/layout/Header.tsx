'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Calendar,
  Gift,
  Info,
  LogIn,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Search,
  Settings,
  User,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLogout } from '@/hooks/useApi';
import { APP_NAME } from '@/lib/app-config';
import { useAuthStore } from '@/lib/store';
import { cn, getUserFirstName, getUserFullName, resolveAssetUrl } from '@/lib/utils';
import NotificationBell from './NotificationBell';

const navLinks = [
  { href: '/', label: 'Home', icon: null },
  { href: '/sermons', label: 'Sermons', icon: BookOpen },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/ministries', label: 'Ministries', icon: Users },
  { href: '/news', label: 'News', icon: Newspaper },
  { href: '/community', label: 'Community', icon: Users },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Mail },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const logoutMutation = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    router.push('/');
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setMobileMenuOpen(false);
  };

  const linkClass = (href: string, mobile = false) =>
    cn(
      mobile
        ? 'flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium'
        : 'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
      'transition-colors',
      isActive(href)
        ? 'bg-sky-700/10 text-sky-700 dark:bg-cyan-400/10 dark:text-cyan-300'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
    );

  const firstName = getUserFirstName(user);
  const fullName = getUserFullName(user) || 'Account';
  const avatarUrl = resolveAssetUrl(
    (user as any)?.profileImageUrl || (user as any)?.profile_image_url || null
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95">
      <nav aria-label="Main navigation" className="container-max flex items-center justify-between gap-4 py-4">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
            <Bell className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white">
              {APP_NAME}
            </span>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-600 dark:text-amber-300">
              Grace In Motion
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {Icon ? <Icon className="h-4 w-4" /> : null}
                {link.label}
              </Link>
            );
          })}
        </div>

        <form
          onSubmit={handleSearchSubmit}
          className="hidden max-w-xs flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex"
        >
          <Search className="h-4 w-4 text-ui-subtle" />
          <input
            aria-label="Search sermons and events"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sermons, events, news..."
            className="h-11 w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-ui-subtle dark:text-slate-50"
          />
        </form>

        <div className="hidden items-center gap-2 md:flex">
          {!isAuthenticated && (
            <Button
              asChild
              variant="ghost"
              className="text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
            >
              <Link href="/login">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          )}

          <Button asChild className="rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400">
            <Link href="/donate">
              <Gift className="mr-2 h-4 w-4" />
              Give
            </Link>
          </Button>

          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              {user.role === 'admin' && (
                <Button variant="outline" asChild className="rounded-full">
                  <Link href="/admin">Admin</Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full border-slate-300 p-0 dark:border-slate-600"
                    aria-label="Open account menu"
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={fullName}
                        width={42}
                        height={42}
                        unoptimized
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-900 dark:bg-slate-800 dark:text-white">
                        {(firstName || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{fullName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/register">Create Account</Link>
            </Button>
          )}
        </div>

        <button
          type="button"
          className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950 md:hidden dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-panel"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div
          id="mobile-nav-panel"
          className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950"
        >
          <div className="space-y-4">
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900"
            >
              <Search className="h-4 w-4 text-ui-subtle" />
              <input
                aria-label="Search sermons and events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-11 w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-ui-subtle dark:text-slate-50"
              />
            </form>

            <div className="grid gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={linkClass(link.href, true)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="grid gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
              <Link
                href="/donate"
                className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Gift className="h-4 w-4" />
                Give Now
              </Link>

              {isAuthenticated && user ? (
                <>
                  {user.role === 'admin' && (
                    <Link href="/admin" className={linkClass('/admin', true)} onClick={() => setMobileMenuOpen(false)}>
                      <Settings className="h-4 w-4" />
                      Admin
                    </Link>
                  )}
                  <Link href="/dashboard" className={linkClass('/dashboard', true)} onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/profile" className={linkClass('/profile', true)} onClick={() => setMobileMenuOpen(false)}>
                    <Settings className="h-4 w-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={linkClass('/login', true)} onClick={() => setMobileMenuOpen(false)}>
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Link>
                  <Link href="/register" className={linkClass('/register', true)} onClick={() => setMobileMenuOpen(false)}>
                    <User className="h-4 w-4" />
                    Create Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
