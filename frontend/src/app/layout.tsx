import type { Metadata, Viewport } from 'next';
import { ReactNode } from 'react';
import Providers from '@/components/app/Providers';
import PwaRegistration from '@/components/app/PwaRegistration';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { APP_NAME, APP_TAGLINE } from '@/lib/app-config';
import '@/styles/globals.css';

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_NAME,
  description: APP_TAGLINE,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/apple-icon',
    icon: [
      { url: '/icon?size=192', sizes: '192x192', type: 'image/png' },
      { url: '/icon?size=512', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#0369a1',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <PwaRegistration />
          <a
            href="#main-content"
            className="sr-only left-4 top-4 z-[100] rounded-md bg-sky-700 px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" tabIndex={-1} className="min-h-screen">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
