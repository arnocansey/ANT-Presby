'use client';

import React from 'react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';
import { useAdminPrayerRequests, useApprovePrayer, useSetPrayerSharing } from '@/hooks/useApi';

type AdminPrayer = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  created_at?: string;
  share_on_wall?: boolean;
  is_anonymous?: boolean;
};

export default function AdminPrayersPage() {
  const { data, isLoading, isError, refetch } = useAdminPrayerRequests();
  const approve = useApprovePrayer();
  const setSharing = useSetPrayerSharing();
  const [query, setQuery] = React.useState('');
  const prayers = (data ?? []) as AdminPrayer[];

  const filteredPrayers = prayers.filter((prayer) => {
    const q = query.trim().toLowerCase();
    return !q || prayer.title.toLowerCase().includes(q) || String(prayer.category || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Prayer requests' }]}
        title="Prayer requests"
        description="Review incoming requests and approve them."
      />

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search prayer requests"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or category"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading prayer requests" />
      ) : isError && prayers.length === 0 ? (
        <LoadError what="prayer requests" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No prayer requests match your search.' : 'No prayer requests yet.'}
          columns={[
            {
              key: 'title',
              header: 'Request',
              render: (prayer: AdminPrayer) => (
                <div>
                  <p className="font-semibold text-foreground">{prayer.title}</p>
                  <p className="line-clamp-2 text-xs text-muted">{prayer.description}</p>
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Category',
              render: (prayer: AdminPrayer) => <span className="capitalize">{prayer.category || 'general'}</span>,
            },
            {
              key: 'share_on_wall',
              header: 'Wall',
              render: (prayer: AdminPrayer) =>
                prayer.share_on_wall ? (
                  <Badge tone="gold">{prayer.is_anonymous ? 'Shared (anonymous)' : 'Shared'}</Badge>
                ) : (
                  <span className="text-xs text-muted">Private</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (prayer: AdminPrayer) => (
                <Badge tone={statusTone(prayer.status || 'pending')}>{statusLabel(prayer.status || 'pending')}</Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (prayer: AdminPrayer) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => approve.mutate(prayer.id)}
                    disabled={approve.isPending || prayer.status === 'approved'}
                  >
                    {prayer.status === 'approved' ? 'Approved' : 'Approve'}
                  </Button>
                  {prayer.share_on_wall && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={setSharing.isPending}
                      onClick={() =>
                        setSharing.mutate({
                          id: prayer.id,
                          title: prayer.title,
                          description: prayer.description || '',
                          category: prayer.category || 'other',
                          shareOnWall: false,
                        })
                      }
                    >
                      Remove from wall
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredPrayers}
        />
      )}
    </div>
  );
}
