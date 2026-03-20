import React from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import RouteGuard from '@/components/auth/RouteGuard';
import { APP_NAME } from '@/lib/app-config';

export const metadata = {
  title: `Admin - ${APP_NAME}`,
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requiredRole="admin">
      <AdminLayout>{children}</AdminLayout>
    </RouteGuard>
  );
}
