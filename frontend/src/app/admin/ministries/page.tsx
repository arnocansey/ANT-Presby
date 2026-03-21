'use client';

import React from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import SimpleTable from '@/components/ui/table';
import { useMinistries } from '@/hooks/useApi';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Ministry = {
  id: number;
  name: string;
  description?: string | null;
  leader_name?: string | null;
  sermon_count?: number;
};

export default function AdminMinistriesPage() {
  const { data, isLoading, refetch } = useMinistries();
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
    <div className="container-max space-y-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Manage Ministries</h1>
          <p className="mt-2 text-sm text-ui-subtle">
            Create, update, and remove ministries so sermons and participation stay organized.
          </p>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, leader, or description"
          />
          <Button asChild>
            <Link href="/admin/ministries/new">New Ministry</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-4 text-sm text-ui-subtle">Loading ministries...</CardContent>
        </Card>
      ) : filteredMinistries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No ministries found.</CardContent>
        </Card>
      ) : (
        <SimpleTable
          columns={[
            {
              key: 'name',
              header: 'Ministry',
              render: (ministry: Ministry) => (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{ministry.name}</p>
                  <p className="text-xs text-ui-subtle">
                    {ministry.leader_name || 'Leader not assigned'}
                  </p>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Description',
              render: (ministry: Ministry) => (
                <span className="line-clamp-2 max-w-xl">
                  {ministry.description || 'No ministry description yet.'}
                </span>
              ),
            },
            {
              key: 'sermon_count',
              header: 'Sermons',
              render: (ministry: Ministry) => (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {Number(ministry.sermon_count || 0)}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (ministry: Ministry) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/ministries/${ministry.id}`}>View</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/ministries/${ministry.id}/edit`}>Edit</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedMinistry(ministry)}>
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
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete Ministry'}
          onCancel={() => setSelectedMinistry(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
