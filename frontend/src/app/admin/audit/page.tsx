'use client';

import React from 'react';
import SimpleTable from '@/components/ui/table';
import { useAuditLogs } from '@/hooks/useApi';
import { Card, CardContent } from '@/components/ui/card';

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
  const { data, isLoading } = useAuditLogs(1, 50);
  const logs = (data?.data || []) as AuditLog[];

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Audit Log</h1>
        <p className="mt-2 text-sm text-ui-subtle">Track important admin actions across content, settings, users, and donations.</p>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-4 text-sm text-ui-subtle">Loading audit logs...</CardContent></Card>
      ) : logs.length === 0 ? (
        <Card className="border-dashed"><CardContent className="p-4 text-sm text-ui-subtle">No audit activity recorded yet.</CardContent></Card>
      ) : (
        <SimpleTable
          columns={[
            {
              key: 'summary',
              header: 'Summary',
              render: (log: AuditLog) => (
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">{log.summary}</p>
                  <p className="text-xs text-ui-subtle">{log.entity_type} • {log.action}</p>
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
              render: (log: AuditLog) => new Date(log.created_at).toLocaleString(),
            },
          ]}
          data={logs}
        />
      )}
    </div>
  );
}
