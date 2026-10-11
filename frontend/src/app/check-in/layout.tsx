import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';
import StaffGuard from '@/components/attendance/StaffGuard';
import { APP_NAME } from '@/lib/app-config';

export const metadata = {
  title: `Check-in - ${APP_NAME}`,
};

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard>
      <StaffGuard>
        <div className="container-max py-8 sm:py-10">{children}</div>
      </StaffGuard>
    </RouteGuard>
  );
}
