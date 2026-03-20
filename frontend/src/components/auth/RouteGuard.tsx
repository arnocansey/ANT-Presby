'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

type RouteGuardProps = {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'member';
};

export default function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hydrate } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);
  const [hasStoredToken, setHasStoredToken] = React.useState(false);

  React.useEffect(() => {
    hydrate();
    if (typeof window !== 'undefined') {
      setHasStoredToken(Boolean(localStorage.getItem('access_token')));
    }
    setIsReady(true);
  }, [hydrate]);

  React.useEffect(() => {
    if (!isReady) return;
    if (isLoading) return;

    const tokenExists =
      typeof window !== 'undefined' ? Boolean(localStorage.getItem('access_token')) : hasStoredToken;

    if (!user && !tokenExists) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
      return;
    }

    if (requiredRole === 'admin' && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [hasStoredToken, isLoading, isReady, pathname, requiredRole, router, user]);

  if (
    !isReady ||
    isLoading ||
    !user ||
    (requiredRole === 'admin' && user.role !== 'admin')
  ) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 py-16">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ui-subtle">
            Securing Session
          </p>
          <p className="mt-3 text-sm text-ui-muted">
            Verifying your access before we open this workspace.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
