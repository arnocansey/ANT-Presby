import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAdminEvents } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminAttendanceScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const eventsQuery = useAdminEvents(isAdmin);
  if (!user || !isAdmin) return null;
  const events = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];

  return (
    <AdminShell activeTab="/admin-events">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#34D399', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Attendance</ThemedText>
        </View>
      </View>

      {events.slice(0, 10).map((event: any) => (
        <BrandCard key={String(event?.id)}>
          <View style={styles.eventRow}>
            <View style={styles.eventCopy}>
              <ThemedText type="defaultSemiBold">{event?.name || 'Event'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {event?.event_date ? new Date(event.event_date).toLocaleString() : 'Date TBD'}
              </ThemedText>
            </View>
            <BrandPill>{`${event?.registered_count ?? 0} attending`}</BrandPill>
          </View>
        </BrandCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  eventCopy: { flex: 1, gap: 2 },
});
