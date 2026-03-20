'use client';

import React from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import SimpleTable from '@/components/ui/table';
import { useAdminSermons, useDeleteSermon } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AdminSermon = {
  id: number;
  title: string;
  speaker?: string;
  sermon_date?: string;
  ministry_name?: string | null;
};

export default function AdminSermonsPage() {
  const { data, isLoading } = useAdminSermons();
  const del = useDeleteSermon();
  const [query, setQuery] = React.useState('');
  const [selectedSermon, setSelectedSermon] = React.useState<AdminSermon | null>(null);
  const sermons = (data ?? []) as AdminSermon[];

  const filteredSermons = sermons.filter((sermon) => {
    const q = query.trim().toLowerCase();
    return !q || sermon.title.toLowerCase().includes(q) || String(sermon.speaker || '').toLowerCase().includes(q);
  });

  return (
    <div className="container-max space-y-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Manage Sermons</h1>
          <p className="mt-2 text-sm text-ui-subtle">Keep the sermon library organized and easy to maintain.</p>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or speaker"
          />
          <Button asChild><Link href="/admin/sermons/new">New Sermon</Link></Button>
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-4 text-sm text-ui-subtle">Loading sermons...</CardContent></Card>
      ) : filteredSermons.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-4 text-sm text-ui-subtle">No sermons found.</CardContent></Card>
      ) : (
        <SimpleTable
          columns={[
            {
              key: 'title',
              header: 'Title',
              render: (sermon: AdminSermon) => (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{sermon.title}</p>
                  <p className="text-xs text-ui-subtle">{sermon.ministry_name || 'No ministry assigned'}</p>
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
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/admin/sermons/${sermon.id}/edit`}>Edit</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedSermon(sermon)}>
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
          confirmLabel="Delete Sermon"
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
