'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, Search, Settings, User, X } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { useLogout } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/app-config';
import { cn, getUserFirstName, getUserFullName, resolveAssetUrl } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import NotificationBell from './NotificationBell';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/sermons', label: 'Sermons' },
  { href: '/ministries', label: 'Ministries' },
  { href: '/news', label: 'News' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/donate', label: 'Donate' },
  { href: '/contact', label: 'Contact' },
];

const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const logoutMutation = useLogout();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
      mobile ? 'block rounded-md px-3 py-2 text-sm font-medium' : 'text-sm font-medium',
      'transition-colors',
      pathname === href
        ? 'text-sky-700 dark:text-cyan-300'
        : 'text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white'
    );

  const firstName = getUserFirstName(user);
  const fullName = getUserFullName(user) || 'Account';
  const avatarUrl = resolveAssetUrl(
    (user as any)?.profileImageUrl || (user as any)?.profile_image_url || null
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur dark:border-slate-800/90 dark:bg-slate-950/95">
      <nav aria-label="Main navigation" className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-700 via-cyan-600 to-blue-600 shadow-sm" />
          <span className="text-xl font-bold text-slate-900 dark:text-white">{APP_NAME}</span>
        </Link>

        <div className="hidden items-center space-x-6 lg:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClass(link.href)}>
              {link.label}
            </Link>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="hidden flex-1 max-w-xs items-center rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900 md:flex">
          <Search className="h-4 w-4 text-ui-subtle" />
          <input
            aria-label="Search sermons and events"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sermons and events..."
            className="h-10 w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-ui-subtle dark:text-slate-50"
          />
        </form>

        <div className="hidden items-center space-x-2 md:flex">
          <Button asChild>
            <Link href="/donate">Donate</Link>
          </Button>
          {isAuthenticated && user ? (
            <>
              <NotificationBell />
              {user.role === 'admin' && (
                <Button variant="outline" asChild>
                  <Link href="/admin">Admin Dashboard</Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-full border-slate-300 p-0 dark:border-slate-600" aria-label="Open account menu">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={fullName}
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
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
            <>
              <Button variant="outline" asChild>
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100 hover:text-slate-950 md:hidden dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-panel"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-nav-panel" className="border-t border-slate-200 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex items-center rounded-md border border-slate-300 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
              <Search className="h-4 w-4 text-ui-subtle" />
              <input
                aria-label="Search sermons and events"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-10 w-full bg-transparent px-2 text-sm text-slate-900 outline-none placeholder:text-ui-subtle dark:text-slate-50"
              />
            </form>

            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href, true)} onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}

            {isAuthenticated && user ? (
              <>
                {user.role === 'admin' && (
                  <Link href="/admin" className={linkClass('/admin', true)} onClick={() => setMobileMenuOpen(false)}>
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/dashboard" className={linkClass('/dashboard', true)} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/profile" className={linkClass('/profile', true)} onClick={() => setMobileMenuOpen(false)}>
                  Profile
                </Link>
                <button type="button" onClick={handleLogout} className="block rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/50">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass('/login', true)} onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className={linkClass('/register', true)} onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
