import React from 'react';

import { AdminShell } from '@/components/admin-shell';
import { ListGroup, ListRow, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuditLogs } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function AdminAuditScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const logsQuery = useAuditLogs(isAdmin);
  const logs = logsQuery.data || [];

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Audit log"
          title="Admin access required"
          subtitle="Sign in with an admin account to review system activity from mobile."
        />
      </Screen>
    );
  }

  return (
    <AdminShell activeTab="/admin-audit">
      <ScreenHeader
        back
        eyebrow="Admin"
        title="Activity log"
        subtitle="Recent admin activity across settings, content, donations and users."
      />

      {logsQuery.isLoading ? (
        <LoadingList count={4} height={64} />
      ) : logs.length > 0 ? (
        <ListGroup>
          {logs.map((log: any) => (
            <ListRow
              key={String(log?.id)}
              label={log?.summary || 'Audit entry'}
              description={[log?.actor_name || log?.actor_email || 'System', log?.created_at || log?.createdAt || ''].filter(Boolean).join(' · ')}
              trailing={<AppBadge>{String(log?.entity_type || log?.entityType || 'audit')}</AppBadge>}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="pulse-outline" title="No audit activity recorded yet" />
      )}
    </AdminShell>
  );
}
