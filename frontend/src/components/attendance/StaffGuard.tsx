'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useProfile } from '@/hooks/useApi';

export const canTakeAttendance = (profile?: { role?: string; can_take_attendance?: boolean } | null) =>
  profile?.role === 'admin' || Boolean(profile?.can_take_attendance);

// Admins and ushers only. Reads the profile fresh, so a member whose usher switch is off is sent away.
export default function StaffGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const allowed = canTakeAttendance(profile);

  React.useEffect(() => {
    if (!isLoading && !allowed) {
      toast.error('You do not have attendance access');
      router.replace('/dashboard');
    }
  }, [allowed, isLoading, router]);

  if (isLoading || !allowed) {
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
