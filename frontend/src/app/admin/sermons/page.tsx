'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminSubNav from '@/components/admin/sub-nav';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB, SERMON_TABS } from '@/components/admin/admin-nav';
import { useAdminSermons, useDeleteSermon } from '@/hooks/useApi';

type AdminSermon = {
  id: number;
  title: string;
  speaker?: string;
  sermon_date?: string;
  ministry_name?: string | null;
};

export default function AdminSermonsPage() {
  const { data, isLoading, isError, refetch } = useAdminSermons();
  const del = useDeleteSermon();
  const [query, setQuery] = React.useState('');
  const [selectedSermon, setSelectedSermon] = React.useState<AdminSermon | null>(null);
  const sermons = (data ?? []) as AdminSermon[];

  const filteredSermons = sermons.filter((sermon) => {
    const q = query.trim().toLowerCase();
    return !q || sermon.title.toLowerCase().includes(q) || String(sermon.speaker || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Sermons' }]}
        title="Sermons"
        description="Keep the sermon library organised and easy to maintain."
        actions={
          <Button asChild>
            <Link href="/admin/sermons/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New sermon
            </Link>
          </Button>
        }
      />
      <AdminSubNav label="Sermons and series" items={SERMON_TABS} />

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search sermons"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or speaker"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading sermons" />
      ) : isError && sermons.length === 0 ? (
        <LoadError what="sermons" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No sermons match your search.' : 'No sermons yet.'}
          columns={[
            {
              key: 'title',
              header: 'Title',
              render: (sermon: AdminSermon) => (
                <div>
                  <p className="font-semibold text-foreground">{sermon.title}</p>
                  <p className="text-xs text-muted">{sermon.ministry_name || 'No ministry assigned'}</p>
                </div>
              ),
            },
            {
              key: 'speaker',
              header: 'Speaker',
              render: (sermon: AdminSermon) => sermon.speaker || 'Unknown speaker',
            },
            {
              key: 'sermon_date',
              header: 'Date',
              render: (sermon: AdminSermon) =>
                sermon.sermon_date ? new Date(sermon.sermon_date).toLocaleDateString() : 'Unknown',
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (sermon: AdminSermon) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/admin/sermons/${sermon.id}/edit`} aria-label={`Edit ${sermon.title}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedSermon(sermon)} aria-label={`Delete ${sermon.title}`}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredSermons}
        />
      )}

      {selectedSermon && (
        <ConfirmDialog
          title="Delete sermon?"
          description={`This will permanently remove "${selectedSermon.title}".`}
          confirmLabel="Delete sermon"
          onCancel={() => setSelectedSermon(null)}
          onConfirm={() => {
            del.mutate(selectedSermon.id, {
              onSuccess: () => setSelectedSermon(null),
            });
          }}
        />
      )}
    </div>
  );
}
