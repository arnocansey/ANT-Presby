import React from 'react';
import RouteGuard from '@/components/auth/RouteGuard';
import { APP_NAME } from '@/lib/app-config';

export const metadata = {
  title: `Dashboard - ${APP_NAME}`,
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard>{children}</RouteGuard>;
}
