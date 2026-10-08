"use client";

import React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Church,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Search,
  Settings,
  Shield,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/ui/theme-toggle";
import { useLogout } from "@/hooks/useApi";
import { APP_NAME } from "@/lib/app-config";
import {
  GIVE_LINK,
  HUB_LINKS,
  PRIMARY_NAV,
  isActivePath,
} from "@/lib/navigation";
import { useAuthStore } from "@/lib/store";
import {
  cn,
  getUserFirstName,
  getUserFullName,
  resolveAssetUrl,
} from "@/lib/utils";
import NotificationBell from "./NotificationBell";

function Wordmark() {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5"
      aria-label={`${APP_NAME} home`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Church className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">
        {APP_NAME}
      </span>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const logoutMutation = useLogout();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // The phone menu: close on Escape and stop the page scrolling behind it.
  React.useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  const firstName = getUserFirstName(user);
  const fullName = getUserFullName(user) || "Account";
  const avatarUrl = resolveAssetUrl(
    (user as any)?.profileImageUrl || (user as any)?.profile_image_url || null,
  );
  const isAdmin = user?.role === "admin";

  const navLinkClass = (href: string) =>
    cn(
      "relative inline-flex h-11 items-center px-3 text-sm font-semibold transition-colors",
      isActivePath(pathname, href)
        ? "text-primary"
        : "text-muted hover:text-foreground",
    );

  const menuLinkClass = (href: string) =>
    cn(
      "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors",
      isActivePath(pathname, href)
        ? "bg-primary/10 text-primary"
        : "text-foreground hover:bg-surface",
    );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="container-max flex h-16 items-center gap-4"
      >
        <Wordmark />

        <div className="hidden items-center md:flex">
          {PRIMARY_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(link.href)}
              aria-current={
                isActivePath(pathname, link.href) ? "page" : undefined
              }
            >
              {link.label}
              {isActivePath(pathname, link.href) && (
                <span
                  className="absolute inset-x-3 -bottom-[11px] h-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Search">
            <Link href="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {isAuthenticated && user ? <NotificationBell /> : null}

          <Button asChild size="sm" className="ml-1">
            <Link href={GIVE_LINK.href}>
              <GIVE_LINK.icon className="h-4 w-4" aria-hidden="true" />
              {GIVE_LINK.label}
            </Link>
          </Button>

          {isAuthenticated && user ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    aria-label="Open account menu"
                  >
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt=""
                        width={36}
                        height={36}
                        unoptimized
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {(firstName || "U").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">
                    {fullName}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" /> My dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="gap-2">
                      <Settings className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="gap-2">
                        <Shield className="h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="gap-2 text-danger"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden md:inline-flex"
            >
              <Link href="/login">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {/* Rendered into <body>: the header's backdrop blur would otherwise clip a fixed overlay to the header. */}
      {menuOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60] md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-foreground/40 animate-fade-in"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            />
            <div
              id="mobile-nav-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col overflow-y-auto border-l border-border bg-background p-4 shadow-xl animate-slide-up"
            >
              <div className="mb-4 flex items-center justify-between">
                <Wordmark />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              <div className="grid gap-1">
                {PRIMARY_NAV.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={menuLinkClass(link.href)}
                  >
                    <link.icon className="h-5 w-5" aria-hidden="true" />
                    {link.label}
                  </Link>
                ))}
              </div>

              <p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Explore
              </p>
              <div className="grid gap-1">
                {HUB_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={menuLinkClass(link.href)}
                  >
                    <link.icon className="h-5 w-5" aria-hidden="true" />
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-5 grid gap-1 border-t border-border pt-4">
                {isAuthenticated && user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={menuLinkClass("/dashboard")}
                    >
                      <LayoutDashboard className="h-5 w-5" aria-hidden="true" />{" "}
                      My dashboard
                    </Link>
                    <Link href="/profile" className={menuLinkClass("/profile")}>
                      <User className="h-5 w-5" aria-hidden="true" /> Profile
                    </Link>
                    {isAdmin && (
                      <Link href="/admin" className={menuLinkClass("/admin")}>
                        <Shield className="h-5 w-5" aria-hidden="true" /> Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-danger hover:bg-surface"
                    >
                      <LogOut className="h-5 w-5" aria-hidden="true" /> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className={menuLinkClass("/login")}>
                      <LogIn className="h-5 w-5" aria-hidden="true" /> Sign in
                    </Link>
                    <Link
                      href="/register"
                      className={menuLinkClass("/register")}
                    >
                      <User className="h-5 w-5" aria-hidden="true" /> Create
                      account
                    </Link>
                  </>
                )}
                <div className="flex min-h-11 items-center justify-between px-3 text-sm font-semibold text-foreground">
                  Theme
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
