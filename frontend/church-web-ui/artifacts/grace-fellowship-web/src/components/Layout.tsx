import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home, BookOpen, Calendar, Gift, Users, Heart, Menu, X,
  Cross, Bell, Search, ChevronRight, LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/sermons", label: "Sermons", icon: BookOpen },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/give", label: "Give", icon: Gift },
  { href: "/community", label: "Community", icon: Users },
  { href: "/groups", label: "Small Groups", icon: Users },
  { href: "/prayer", label: "Prayer Wall", icon: Heart },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-sidebar border-b border-border backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
                <Cross className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg text-foreground leading-none">Grace</span>
                <span className="text-primary font-bold text-lg leading-none ml-1.5">Fellowship</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <button
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </Link>
              ))}
            </nav>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-muted-foreground hover:text-foreground" data-testid="btn-sign-in">
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Button>
              </Link>
              <Link href="/give">
                <Button size="sm" className="hidden sm:flex gap-2 bg-primary text-primary-foreground hover:bg-primary/90" data-testid="btn-give">
                  <Gift className="w-4 h-4" />
                  Give
                </Button>
              </Link>
              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setMobileOpen(!mobileOpen)}
                data-testid="btn-mobile-menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-sidebar">
            <nav className="flex flex-col p-3 gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                  <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </button>
                </Link>
              ))}
              <div className="border-t border-border mt-2 pt-2 flex flex-col gap-1">
                <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </Link>
                <Link href="/give" onClick={() => setMobileOpen(false)}>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/15 text-primary">
                    <Gift className="w-4 h-4" />
                    Give
                  </button>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-sidebar border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Cross className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">Grace Fellowship</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Where Grace Meets Community. Join us every Sunday for worship, community, and spiritual growth.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Worship</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/sermons" className="hover:text-primary transition-colors">Sermons</Link></li>
                <li><Link href="/events" className="hover:text-primary transition-colors">Events</Link></li>
                <li><Link href="/prayer" className="hover:text-primary transition-colors">Prayer Wall</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/groups" className="hover:text-primary transition-colors">Small Groups</Link></li>
                <li><Link href="/community" className="hover:text-primary transition-colors">Community Feed</Link></li>
                <li><Link href="/give" className="hover:text-primary transition-colors">Give</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wider">Service Times</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Sunday • 10:00 AM</li>
                <li>Sunday • 12:00 PM</li>
                <li>Wednesday • 7:00 PM</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3">123 Faith Avenue, Grace City</p>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-6 text-center text-xs text-muted-foreground">
            © 2026 Grace Fellowship. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
