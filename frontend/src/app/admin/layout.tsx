import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import RouteGuard from '@/components/auth/RouteGuard';
import { APP_NAME } from '@/lib/app-config';
import { getSessionFromToken } from '@/lib/auth/session';

export const metadata = {
  title: `Admin - ${APP_NAME}`,
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get('access_token')?.value ||
    cookieStore.get('token')?.value;
  const session = getSessionFromToken(accessToken);

  if (!session) {
    redirect('/login');
  }

  if (session.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <RouteGuard requiredRole="admin">
      <AdminLayout>{children}</AdminLayout>
    </RouteGuard>
  );
}
