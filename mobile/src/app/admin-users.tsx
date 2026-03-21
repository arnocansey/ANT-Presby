import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminUsersScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const usersQuery = useAdminUsers(isAdmin);
  const updateRoleMutation = useUpdateUserRole();
  const theme = useTheme();

  if (!user || !isAdmin) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Admin Users"
          title="Admin access required"
          description="Sign in with an admin account to manage user roles from mobile."
        />
      </BrandScreen>
    );
  }

  const users = usersQuery.data || [];

  const total = users.length;
  const admins = users.filter((item: any) => String(item?.role || '').toLowerCase() === 'admin').length;
  const members = users.filter((item: any) => String(item?.role || '').toLowerCase() === 'member').length;

  return (
    <AdminShell activeTab="/admin-users">
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#60A5FA', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Members</ThemedText>
        </View>
        <View style={[styles.iconButton, { backgroundColor: '#2563EB', borderColor: '#2563EB' }]}>
          <Ionicons name="person-add-outline" size={16} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricChip label="Total" value={String(total)} color="#60A5FA" />
        <MetricChip label="Admins" value={String(admins)} color="#FBBF24" />
        <MetricChip label="Members" value={String(members)} color="#34D399" />
      </View>

      <BrandCard>
        <BrandSectionHeader title="Recent users" description="Quick role changes for admin and member accounts." />
        {usersQuery.isLoading ? (
          <ThemedText type="small">Loading users...</ThemedText>
        ) : users.length > 0 ? (
          users.slice(0, 12).map((item: any) => {
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
              <View key={String(item?.id)} style={[styles.userRow, { borderColor: 'rgba(255,255,255,0.08)' }]}>
                <View style={styles.userMain}>
                  <View style={[styles.avatar, { backgroundColor: currentRole === 'admin' ? '#F59E0B' : '#2563EB' }]}>
                    <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                      {initials}
                    </ThemedText>
                  </View>
                  <View style={styles.userCopy}>
                    <View style={styles.nameRow}>
                      <ThemedText type="defaultSemiBold">{name || item?.email || 'User account'}</ThemedText>
                      <BrandPill>{currentRole}</BrandPill>
                    </View>
                    <ThemedText type="small">{item?.email || 'No email available'}</ThemedText>
                  </View>
                </View>
                <BrandButton
                  label={`Make ${nextRole}`}
                  onPress={() => updateRoleMutation.mutate({ id: Number(item?.id), role: nextRole })}
                  variant="outline"
                />
              </View>
            );
          })
        ) : (
          <ThemedText type="small">No users available.</ThemedText>
        )}
      </BrandCard>
    </AdminShell>
  );
}

function MetricChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={[styles.metricChip, { borderColor: `${color}33`, backgroundColor: `${color}14` }]}>
      <ThemedText type="defaultSemiBold" style={{ color }}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  metricChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    gap: 2,
  },
  userRow: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  userMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCopy: {
    gap: 4,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
