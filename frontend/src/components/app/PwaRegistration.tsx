'use client';

import { useEffect } from 'react';

export default function PwaRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        void registration.update();
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('PWA service worker registration failed', error);
        }
      }
    };

    void register();
  }, []);

  return null;
}
