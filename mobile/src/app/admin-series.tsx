import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAdminSermons } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminSeriesScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const sermonsQuery = useAdminSermons(isAdmin);
  if (!user || !isAdmin) return null;
  const sermons = Array.isArray(sermonsQuery.data) ? sermonsQuery.data : [];
  const grouped = Array.from(
    sermons.reduce((map, sermon: any) => {
      const key = sermon?.series || 'Standalone';
      map.set(key, [...(map.get(key) || []), sermon]);
      return map;
    }, new Map<string, any[]>()),
  ) as [string, any[]][];

  return (
    <AdminShell activeTab="/admin-sermons">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#C084FC', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Series Manager</ThemedText>
        </View>
      </View>

      {grouped.map(([series, items]) => (
        <BrandCard key={series}>
          <View style={styles.seriesRow}>
            <ThemedText type="defaultSemiBold">{series}</ThemedText>
            <BrandPill>{`${items.length} sermons`}</BrandPill>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Latest: {items[0]?.title || 'No sermon title'}
          </ThemedText>
        </BrandCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  seriesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
});
