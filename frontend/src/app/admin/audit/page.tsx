'use client';

import React from 'react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAuditLogs } from '@/hooks/useApi';

type AuditLog = {
  id: number;
  summary: string;
  action: string;
  entity_type: string;
  actor_name?: string | null;
  actor_email?: string | null;
  created_at: string;
};

export default function AdminAuditPage() {
  const { data, isLoading, isError, refetch } = useAuditLogs(1, 50);
  const logs = (data?.data || []) as AuditLog[];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Activity log' }]}
        title="Activity log"
        description="Important admin actions across content, settings, members and donations (latest 50)."
      />

      {isLoading ? (
        <TableSkeleton label="Loading activity" />
      ) : isError && logs.length === 0 ? (
        <LoadError what="the activity log" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage="No activity recorded yet."
          columns={[
            {
              key: 'summary',
              header: 'Summary',
              render: (log: AuditLog) => (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{log.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="neutral">{log.entity_type}</Badge>
                    <Badge tone="neutral">{log.action}</Badge>
                  </div>
                </div>
              ),
            },
            {
              key: 'actor',
              header: 'Actor',
              render: (log: AuditLog) => log.actor_name || log.actor_email || 'System',
            },
            {
              key: 'created_at',
              header: 'When',
              render: (log: AuditLog) => (
                <time dateTime={log.created_at} className="text-muted">
                  {new Date(log.created_at).toLocaleString()}
                </time>
              ),
            },
          ]}
          data={logs}
        />
      )}
    </div>
  );
}
