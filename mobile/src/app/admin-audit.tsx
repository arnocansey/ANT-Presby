import React from 'react';

import { AdminShell } from '@/components/admin-shell';
import { BrandCard, BrandHero, BrandPill, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { useAuditLogs } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function AdminAuditScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const logsQuery = useAuditLogs(isAdmin);
  const logs = logsQuery.data || [];

  if (!user || !isAdmin) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Audit Log"
          title="Admin access required"
          description="Sign in with an admin account to review system activity from mobile."
        />
      </BrandScreen>
    );
  }

  return (
    <AdminShell activeTab="/admin-audit">
      <BrandHero
        eyebrow="Audit Log"
        title="Track admin activity"
        description="Review the recent audit stream across settings, content, donations, and user actions."
      />

      <BrandCard>
        <BrandSectionHeader title="Recent audit entries" description="A mobile-readable activity stream from the audit log." />
        {logsQuery.isLoading ? (
          <ThemedText type="small">Loading audit activity...</ThemedText>
        ) : logs.length > 0 ? (
          logs.map((log: any) => (
            <BrandCard key={String(log?.id)}>
              <BrandPill>{log?.entity_type || log?.entityType || 'audit'}</BrandPill>
              <ThemedText type="defaultSemiBold">{log?.summary || 'Audit entry'}</ThemedText>
              <ThemedText type="small">{log?.actor_name || log?.actor_email || 'System'}</ThemedText>
              <ThemedText type="small">{log?.created_at || log?.createdAt || ''}</ThemedText>
            </BrandCard>
          ))
        ) : (
          <ThemedText type="small">No audit activity recorded yet.</ThemedText>
        )}
      </BrandCard>
    </AdminShell>
  );
}
