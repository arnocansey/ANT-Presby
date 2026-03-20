'use client';

import React from 'react';
import SimpleTable from '@/components/ui/table';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AdminUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'member';
  is_active?: boolean;
  created_at?: string;
};

export default function AdminUsersPage() {
  const { data, isLoading } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const [query, setQuery] = React.useState('');
  const users = (data ?? []) as AdminUser[];

  const filteredUsers = users.filter((user) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').toLowerCase();
    const q = query.trim().toLowerCase();
    return !q || fullName.includes(q) || user.email.toLowerCase().includes(q) || user.role.includes(q);
  });

  return (
    <div className="container-max space-y-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Manage Users</h1>
          <p className="mt-2 text-sm text-ui-subtle">Search, review, and update access roles for users.</p>
        </div>
        <div className="w-full md:max-w-sm">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email, or role"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Total Users</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{users.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Admins</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{users.filter((user) => user.role === 'admin').length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Members</CardTitle></CardHeader>
          <CardContent className="text-3xl font-bold">{users.filter((user) => user.role === 'member').length}</CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-4 text-sm text-ui-subtle">Loading users...</CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No users match the current search.</CardContent>
        </Card>
      ) : (
        <SimpleTable
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (user: AdminUser) => (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unnamed user'}
                  </p>
                  <p className="text-xs text-ui-subtle">{user.email}</p>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (user: AdminUser) => (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-sky-100 text-sky-800 dark:bg-cyan-950/50 dark:text-cyan-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                  {user.role}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (user: AdminUser) => (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active === false ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                  {user.is_active === false ? 'inactive' : 'active'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (user: AdminUser) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    updateRole.mutate({ id: user.id, role: user.role === 'admin' ? 'member' : 'admin' })
                  }
                  disabled={updateRole.isPending}
                >
                  Make {user.role === 'admin' ? 'Member' : 'Admin'}
                </Button>
              ),
            },
          ]}
          data={filteredUsers}
        />
      )}
    </div>
  );
}
