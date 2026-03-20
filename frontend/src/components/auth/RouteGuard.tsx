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
  const { user, hydrate } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    hydrate();
    setIsReady(true);
  }, [hydrate]);

  React.useEffect(() => {
    if (!isReady) return;

    if (!user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
      return;
    }

    if (requiredRole === 'admin' && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [isReady, pathname, requiredRole, router, user]);

  if (!isReady || !user || (requiredRole === 'admin' && user.role !== 'admin')) {
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
