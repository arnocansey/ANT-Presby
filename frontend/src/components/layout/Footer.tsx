import React from 'react';
import Link from 'next/link';
import { Church, Mail, MapPin, Phone } from 'lucide-react';
import {
  APP_CONTACT_EMAIL,
  APP_CONTACT_LOCATION,
  APP_CONTACT_PHONE,
  APP_NAME,
  APP_TAGLINE,
} from '@/lib/app-config';
import { FOOTER_GROUPS } from '@/lib/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-max grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Church className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
          </Link>
          <p className="max-w-xs text-sm text-muted">{APP_TAGLINE}</p>
          <ul className="space-y-2 text-sm text-muted">
            {APP_CONTACT_LOCATION && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <span>{APP_CONTACT_LOCATION}</span>
              </li>
            )}
            {APP_CONTACT_PHONE && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <span>{APP_CONTACT_PHONE}</span>
              </li>
            )}
            {APP_CONTACT_EMAIL && (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <a href={`mailto:${APP_CONTACT_EMAIL}`} className="hover:text-foreground">
                  {APP_CONTACT_EMAIL}
                </a>
              </li>
            )}
          </ul>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{group.title}</h2>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-max flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <Link href="/donate" className="font-semibold text-link hover:underline">
            Support the ministry
          </Link>
        </div>
      </div>
    </footer>
  );
}
