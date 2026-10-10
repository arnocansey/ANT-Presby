'use client';

import React from 'react';
import { UserRoundCog, Users, UsersRound } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatCard from '@/components/admin/stat-card';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useApi';

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
  const { data, isLoading, isError, refetch } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const [query, setQuery] = React.useState('');
  const users = (data ?? []) as AdminUser[];

  const filteredUsers = users.filter((user) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').toLowerCase();
    const q = query.trim().toLowerCase();
    return !q || fullName.includes(q) || user.email.toLowerCase().includes(q) || user.role.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Members' }]}
        title="Members"
        description="Search people and change who has admin access."
      />

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="All accounts" icon={Users} loading={isLoading} value={users.length} />
        <StatCard label="Admins" icon={UserRoundCog} loading={isLoading} value={users.filter((user) => user.role === 'admin').length} />
        <StatCard label="Members" icon={UsersRound} loading={isLoading} value={users.filter((user) => user.role === 'member').length} />
      </section>

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search members"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email or role"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading members" />
      ) : isError && users.length === 0 ? (
        <LoadError what="members" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No one matches your search.' : 'No accounts yet.'}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (user: AdminUser) => (
                <div>
                  <p className="font-semibold text-foreground">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unnamed user'}
                  </p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (user: AdminUser) => (
                <Badge tone={user.role === 'admin' ? 'gold' : 'neutral'}>{user.role === 'admin' ? 'Admin' : 'Member'}</Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (user: AdminUser) => (
                <Badge tone={user.is_active === false ? 'danger' : 'success'}>
                  {user.is_active === false ? 'Inactive' : 'Active'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (user: AdminUser) => (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateRole.mutate({ id: user.id, role: user.role === 'admin' ? 'member' : 'admin' })}
                  disabled={updateRole.isPending}
                >
                  Make {user.role === 'admin' ? 'member' : 'admin'}
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
