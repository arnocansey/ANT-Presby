'use client';

import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useMinistries } from '@/hooks/useApi';
import apiClient from '@/lib/api';

type Ministry = {
  id: number;
  name: string;
  description?: string | null;
  leader_name?: string | null;
  sermon_count?: number;
};

export default function AdminMinistriesPage() {
  const { data, isLoading, isError, refetch } = useMinistries();
  const [query, setQuery] = React.useState('');
  const [selectedMinistry, setSelectedMinistry] = React.useState<Ministry | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const ministries = (data ?? []) as Ministry[];

  const filteredMinistries = ministries.filter((ministry) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    return (
      ministry.name.toLowerCase().includes(q) ||
      String(ministry.description || '').toLowerCase().includes(q) ||
      String(ministry.leader_name || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!selectedMinistry) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/ministries/${selectedMinistry.id}`);
      toast.success('Ministry deleted');
      setSelectedMinistry(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete ministry');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Ministries' }]}
        title="Ministries"
        description="Create, update and remove ministries so sermons and participation stay organised."
        actions={
          <Button asChild>
            <Link href="/admin/ministries/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New ministry
            </Link>
          </Button>
        }
      />

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search ministries"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, leader or description"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading ministries" />
      ) : isError && ministries.length === 0 ? (
        <LoadError what="ministries" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No ministries match your search.' : 'No ministries yet.'}
          columns={[
            {
              key: 'name',
              header: 'Ministry',
              render: (ministry: Ministry) => (
                <div>
                  <p className="font-semibold text-foreground">{ministry.name}</p>
                  <p className="text-xs text-muted">{ministry.leader_name || 'Leader not assigned'}</p>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Description',
              render: (ministry: Ministry) => (
                <span className="line-clamp-2 max-w-xl">{ministry.description || 'No ministry description yet.'}</span>
              ),
            },
            {
              key: 'sermon_count',
              header: 'Sermons',
              render: (ministry: Ministry) => <Badge tone="neutral">{Number(ministry.sermon_count || 0)}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (ministry: Ministry) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/ministries/${ministry.id}`} aria-label={`View ${ministry.name}`}>
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/admin/ministries/${ministry.id}/edit`} aria-label={`Edit ${ministry.name}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedMinistry(ministry)} aria-label={`Delete ${ministry.name}`}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredMinistries}
        />
      )}

      {selectedMinistry && (
        <ConfirmDialog
          title="Delete ministry?"
          description={`This will permanently remove "${selectedMinistry.name}".`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete ministry'}
          onCancel={() => setSelectedMinistry(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
