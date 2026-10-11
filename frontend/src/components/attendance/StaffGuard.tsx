'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useApi';

export const canTakeAttendance = (profile?: { role?: string; can_take_attendance?: boolean } | null) =>
  profile?.role === 'admin' || Boolean(profile?.can_take_attendance);

// Admins and ushers only. Reads the profile fresh, so a member whose usher switch is off is sent away.
export default function StaffGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Always refetch: a cached profile from before an admin turned the usher switch on must not block.
  const { data: profile, isFetching, isError, refetch } = useProfile({ fresh: true });
  const allowed = canTakeAttendance(profile);
  const denied = !isFetching && !isError && !allowed;

  React.useEffect(() => {
    if (denied) {
      toast.error('You do not have attendance access');
      router.replace('/dashboard');
    }
  }, [denied, router]);

  if (!allowed && isError && !isFetching) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center" role="alert">
        <p className="text-sm text-muted">We could not check your access. Check your connection and try again.</p>
        <Button variant="secondary" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Checking access</span>
      </div>
    );
  }

  return <>{children}</>;
}

// When the API says attendance access is gone mid-session, leave the check-in area.
export function useLeaveOnLostAccess(error: unknown) {
  const router = useRouter();
  React.useEffect(() => {
    if ((error as any)?.response?.status === 403) {
      toast.error('You no longer have attendance access');
      router.replace('/dashboard');
    }
  }, [error, router]);
}
