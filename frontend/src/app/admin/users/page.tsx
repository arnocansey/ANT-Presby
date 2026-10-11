'use client';

import React from 'react';
import Link from 'next/link';
import { ClipboardCheck, UserRoundCog, Users, UsersRound } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatCard from '@/components/admin/stat-card';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAdminUsers, useResetCheckInCard, useSetUsher, useUpdateUserRole } from '@/hooks/useApi';

type AdminUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role: 'admin' | 'member';
  is_active?: boolean;
  can_take_attendance?: boolean;
  created_at?: string;
};

// The API sends snake_case names; camelCase is kept for older responses.
const nameOf = (user: AdminUser) =>
  [user.first_name ?? user.firstName, user.last_name ?? user.lastName].filter(Boolean).join(' ') || 'Unnamed user';

export default function AdminUsersPage() {
  const { data, isLoading, isError, refetch } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const setUsher = useSetUsher();
  const resetCard = useResetCheckInCard();
  const [query, setQuery] = React.useState('');
  const [resetting, setResetting] = React.useState<AdminUser | null>(null);
  const users = (data ?? []) as AdminUser[];

  const filteredUsers = users.filter((user) => {
    const fullName = nameOf(user).toLowerCase();
    const q = query.trim().toLowerCase();
    return !q || fullName.includes(q) || user.email.toLowerCase().includes(q) || user.role.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Members' }]}
        title="Members"
        description="Search people, manage admin and usher access, and print check-in cards."
        actions={
          <Button asChild variant="secondary">
            <Link href="/admin/users/cards">Print cards</Link>
          </Button>
        }
      />

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="All accounts" icon={Users} loading={isLoading} value={users.length} />
        <StatCard label="Admins" icon={UserRoundCog} loading={isLoading} value={users.filter((user) => user.role === 'admin').length} />
        <StatCard label="Members" icon={UsersRound} loading={isLoading} value={users.filter((user) => user.role === 'member').length} />
        <StatCard
          label="Ushers"
          icon={ClipboardCheck}
          loading={isLoading}
          value={users.filter((user) => user.role === 'member' && user.can_take_attendance).length}
        />
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
                  <p className="font-semibold text-foreground">{nameOf(user)}</p>
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
              key: 'usher',
              header: 'Usher',
              render: (user: AdminUser) =>
                user.role === 'admin' ? (
                  <span className="text-sm text-muted" aria-label="Admins already take attendance">
                    —
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant={user.can_take_attendance ? 'primary' : 'secondary'}
                    aria-pressed={Boolean(user.can_take_attendance)}
                    aria-label={`Usher access for ${nameOf(user)}`}
                    disabled={setUsher.isPending}
                    onClick={() => setUsher.mutate({ id: user.id, enabled: !user.can_take_attendance })}
                  >
                    {user.can_take_attendance ? 'Usher: on' : 'Usher: off'}
                  </Button>
                ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (user: AdminUser) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => updateRole.mutate({ id: user.id, role: user.role === 'admin' ? 'member' : 'admin' })}
                    disabled={updateRole.isPending}
                  >
                    Make {user.role === 'admin' ? 'member' : 'admin'}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setResetting(user)} disabled={resetCard.isPending}>
                    Reset card
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredUsers}
        />
      )}

      {resetting && (
        <ConfirmDialog
          title="Reset check-in card?"
          description={`Reset ${nameOf(resetting)}'s check-in card? Their old card will stop working.`}
          confirmLabel="Reset card"
          onConfirm={() => {
            resetCard.mutate(resetting.id);
            setResetting(null);
          }}
          onCancel={() => setResetting(null)}
        />
      )}
    </div>
  );
}
