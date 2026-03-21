'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Mail, MapPin, Phone } from 'lucide-react';
import {
  APP_CONTACT_EMAIL,
  APP_CONTACT_LOCATION,
  APP_CONTACT_PHONE,
  APP_NAME,
  APP_TAGLINE,
} from '@/lib/app-config';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-950 text-white dark:border-slate-800">
      <div className="container-max py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <span className="font-black tracking-tight text-white">{APP_NAME}</span>
                <p className="text-xs uppercase tracking-[0.24em] text-amber-300">Community First</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{APP_TAGLINE}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Explore</h3>
            <ul className="space-y-2">
              {[
                ['Home', '/'],
                ['Sermons', '/sermons'],
                ['Events', '/events'],
                ['News', '/news'],
                ['Community', '/community'],
                ['About', '/about'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-slate-300 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Get Involved</h3>
            <ul className="space-y-2">
              {[
                ['Give', '/donate'],
                ['Ministries', '/ministries'],
                ['Contact', '/contact'],
                ['Privacy', '/privacy'],
                ['Terms', '/terms'],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-slate-300 transition-colors hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Contact</h3>
            <ul className="space-y-3">
              {APP_CONTACT_PHONE && (
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <Phone className="mt-0.5 h-4 w-4 text-amber-300" />
                  <span>{APP_CONTACT_PHONE}</span>
                </li>
              )}
              {APP_CONTACT_EMAIL && (
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <Mail className="mt-0.5 h-4 w-4 text-amber-300" />
                  <span>{APP_CONTACT_EMAIL}</span>
                </li>
              )}
              {APP_CONTACT_LOCATION && (
                <li className="flex items-start gap-3 text-sm text-slate-300">
                  <MapPin className="mt-0.5 h-4 w-4 text-amber-300" />
                  <span>{APP_CONTACT_LOCATION}</span>
                </li>
              )}
              {!APP_CONTACT_PHONE && !APP_CONTACT_EMAIL && !APP_CONTACT_LOCATION && (
                <li className="text-sm text-slate-400">
                  Add contact details through your deployed environment when you are ready.
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-400">
          <p>
            &copy; {currentYear} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
