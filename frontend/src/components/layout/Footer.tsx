'use client';

import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import {
  APP_CONTACT_EMAIL,
  APP_CONTACT_LOCATION,
  APP_CONTACT_PHONE,
  APP_NAME,
  APP_TAGLINE,
} from '@/lib/app-config';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-700 via-cyan-600 to-blue-600 shadow-sm" />
              <span className="font-bold text-slate-900 dark:text-white">{APP_NAME}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {APP_TAGLINE}
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-cyan-300">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/sermons" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  Sermons
                </Link>
              </li>
              <li>
                <Link href="/events" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/news" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  News
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-slate-700 hover:text-sky-700 dark:text-slate-300 dark:hover:text-cyan-300">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-900 dark:text-white">Contact</h3>
            <ul className="space-y-3">
              {APP_CONTACT_PHONE && (
                <li className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-sky-700 dark:text-cyan-300" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{APP_CONTACT_PHONE}</span>
                </li>
              )}
              {APP_CONTACT_EMAIL && (
                <li className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-sky-700 dark:text-cyan-300" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{APP_CONTACT_EMAIL}</span>
                </li>
              )}
              {APP_CONTACT_LOCATION && (
                <li className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-sky-700 dark:text-cyan-300" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">{APP_CONTACT_LOCATION}</span>
                </li>
              )}
              {!APP_CONTACT_PHONE && !APP_CONTACT_EMAIL && !APP_CONTACT_LOCATION && (
                <li className="text-sm text-ui-subtle">Add contact details through your deployment environment when ready.</li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-center text-sm text-slate-700 dark:text-slate-300">
              &copy; {currentYear} {APP_NAME}. All rights reserved.
            </p>
            <p className="text-center text-sm text-slate-700 dark:text-slate-300">Independent publishing platform.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
