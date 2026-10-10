import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { Avatar, LoadingList, Screen, ScreenHeader, SectionHeader, StatGrid, StatTile } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Space } from '@/constants/tokens';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminUsersScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const usersQuery = useAdminUsers(isAdmin);
  const updateRoleMutation = useUpdateUserRole();

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin users"
          title="Admin access required"
          subtitle="Sign in with an admin account to manage user roles from mobile."
        />
      </Screen>
    );
  }

  const users = usersQuery.data || [];

  const total = users.length;
  const admins = users.filter((item: any) => String(item?.role || '').toLowerCase() === 'admin').length;
  const members = users.filter((item: any) => String(item?.role || '').toLowerCase() === 'member').length;

  return (
    <AdminShell activeTab="/admin-users">
      <ScreenHeader back eyebrow="Admin" title="Members" />

      <StatGrid minTileWidth={96}>
        <StatTile label="Total" value={String(total)} icon="people-outline" />
        <StatTile label="Admins" value={String(admins)} icon="shield-outline" />
        <StatTile label="Members" value={String(members)} icon="person-outline" />
      </StatGrid>

      <SectionHeader title="Recent users" />
      {usersQuery.isLoading ? (
        <LoadingList count={4} height={96} />
      ) : users.length > 0 ? (
        <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {users.slice(0, 12).map((item: any, index: number) => {
            const name = [item?.first_name || item?.firstName, item?.last_name || item?.lastName]
              .filter(Boolean)
              .join(' ');
            const currentRole = String(item?.role || 'member');
            const nextRole = currentRole === 'admin' ? 'member' : 'admin';
            const initials = (name || item?.email || 'U')
              .split(' ')
              .map((part: string) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <View
                key={String(item?.id)}
                style={[styles.userRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={styles.userMain}>
                  <Avatar initials={initials} size={40} tone={currentRole === 'admin' ? 'gold' : 'primary'} />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {name || item?.email || 'User account'}
                    </AppText>
                    <AppText variant="small" tone="muted" numberOfLines={1}>
                      {item?.email || 'No email available'}
                    </AppText>
                  </View>
                  <AppBadge tone={currentRole === 'admin' ? 'gold' : 'neutral'}>{currentRole}</AppBadge>
                </View>
                <AppButton
                  label={`Make ${nextRole}`}
                  size="sm"
                  variant="secondary"
                  onPress={() => updateRoleMutation.mutate({ id: Number(item?.id), role: nextRole })}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState icon="people-outline" title="No users available" />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: 1, borderRadius: Corner.card, overflow: 'hidden' },
  userRow: { padding: Space.md, gap: Space.sm },
  userMain: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  flex: { flex: 1, gap: 2 },
});
