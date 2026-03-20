'use client';

import React from 'react';
import SimpleTable from '@/components/ui/table';
import { useAdminPrayerRequests, useApprovePrayer } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type AdminPrayer = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  created_at?: string;
};

export default function AdminPrayersPage() {
  const { data, isLoading } = useAdminPrayerRequests();
  const approve = useApprovePrayer();
  const [query, setQuery] = React.useState('');
  const prayers = (data ?? []) as AdminPrayer[];

  const filteredPrayers = prayers.filter((prayer) => {
    const q = query.trim().toLowerCase();
    return !q || prayer.title.toLowerCase().includes(q) || String(prayer.category || '').toLowerCase().includes(q);
  });

  return (
    <div className="container-max space-y-6 py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Prayer Requests</h1>
          <p className="mt-2 text-sm text-ui-subtle">Review incoming requests and approve them quickly.</p>
        </div>
        <div className="w-full md:max-w-sm">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or category"
          />
        </div>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-4 text-sm text-ui-subtle">Loading prayer requests...</CardContent></Card>
      ) : filteredPrayers.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-4 text-sm text-ui-subtle">No prayer requests found.</CardContent></Card>
      ) : (
        <SimpleTable
          columns={[
            {
              key: 'title',
              header: 'Request',
              render: (prayer: AdminPrayer) => (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{prayer.title}</p>
                  <p className="line-clamp-2 text-xs text-ui-subtle">{prayer.description}</p>
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Category',
              render: (prayer: AdminPrayer) => prayer.category || 'general',
            },
            {
              key: 'status',
              header: 'Status',
              render: (prayer: AdminPrayer) => (
                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {prayer.status || 'pending'}
                </span>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (prayer: AdminPrayer) => (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => approve.mutate(prayer.id)}
                  disabled={approve.isPending || prayer.status === 'approved'}
                >
                  {prayer.status === 'approved' ? 'Approved' : 'Approve'}
                </Button>
              ),
            },
          ]}
          data={filteredPrayers}
        />
      )}
    </div>
  );
}
