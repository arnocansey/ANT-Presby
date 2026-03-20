import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RouteGuard from '@/components/auth/RouteGuard';
import { APP_NAME } from '@/lib/app-config';
import { getSessionFromToken } from '@/lib/auth/session';

export const metadata = {
  title: `Dashboard - ${APP_NAME}`,
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get('access_token')?.value ||
    cookieStore.get('token')?.value;
  const session = getSessionFromToken(accessToken);

  if (!session) {
    redirect('/login');
  }

  return <RouteGuard>{children}</RouteGuard>;
}
