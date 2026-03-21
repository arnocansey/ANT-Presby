import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAdminPrayerRequests, useCreatePrayerRequest, useMyPrayerRequests } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function PrayerWallScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const myPrayersQuery = useMyPrayerRequests(Boolean(user));
  const adminPrayersQuery = useAdminPrayerRequests(Boolean(user && isAdmin));
  const prayers = isAdmin
    ? Array.isArray(adminPrayersQuery.data) ? adminPrayersQuery.data : []
    : Array.isArray(myPrayersQuery.data) ? myPrayersQuery.data : [];
  const createPrayerMutation = useCreatePrayerRequest();

  if (!user) {
    return (
      <BrandScreen>
        <BrandCard>
          <ThemedText type="subtitle">Prayer Wall</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sign in to share prayer requests and keep track of approved prayer updates.
          </ThemedText>
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandCard>
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="subtitle">Prayer Wall</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {isAdmin ? 'Admin prayer review stream' : 'Your prayer stream'}
          </ThemedText>
        </View>
        <Pressable
          onPress={() =>
            createPrayerMutation.mutate({
              title: 'Prayer request',
              description: 'Please pray with me. I will update this request soon.',
              category: 'personal',
            })
          }
          style={[styles.iconButton, { backgroundColor: '#E11D48', borderColor: '#E11D48' }]}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.scriptureCard}>
        <ThemedText type="small" style={styles.scriptureText}>
          &quot;Pray for each other so that you may be healed.&quot; - James 5:16
        </ThemedText>
      </View>

      {prayers.length > 0 ? (
        prayers.map((prayer: any) => (
          <BrandCard key={String(prayer?.id)}>
            <View style={styles.prayerHead}>
              <View style={styles.prayerMeta}>
                <ThemedText type="defaultSemiBold">
                  {prayer?.requester_name || prayer?.title || 'Prayer request'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {prayer?.created_at ? new Date(prayer.created_at).toLocaleString() : 'Recently'}
                </ThemedText>
              </View>
              <BrandPill>{prayer?.category || prayer?.status || 'prayer'}</BrandPill>
            </View>
            <ThemedText type="small">{prayer?.description || prayer?.title || 'Prayer details unavailable.'}</ThemedText>
            <View style={styles.prayerActions}>
              <BrandButton label="Open My Requests" onPress={() => router.push('/prayers')} variant="outline" />
            </View>
          </BrandCard>
        ))
      ) : (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No prayer requests yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Submit a request from the prayer screen and it will start showing up here.
          </ThemedText>
          <BrandButton label="Open Prayer Requests" onPress={() => router.push('/prayers')} />
        </BrandCard>
      )}
    </BrandScreen>
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
  scriptureCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    backgroundColor: 'rgba(225,29,72,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(225,29,72,0.16)',
  },
  scriptureText: {
    color: '#FDA4AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  prayerHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  prayerMeta: {
    flex: 1,
    gap: 2,
  },
  prayerActions: {
    marginTop: Spacing.one,
  },
});
