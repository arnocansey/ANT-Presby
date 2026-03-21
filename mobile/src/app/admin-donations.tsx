import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAdminDonations, useUpdateDonationStatus } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminDonationsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const donationsQuery = useAdminDonations(isAdmin);
  const updateDonationMutation = useUpdateDonationStatus();
  const theme = useTheme();

  if (!user) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Admin Giving"
          title="Admin access requires sign in"
          description="Sign in with your ANT PRESS admin account to review donation records."
        >
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandHero>
      </BrandScreen>
    );
  }

  if (!isAdmin) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Admin Giving"
          title="Admin access is restricted"
          description="This mobile donation review area is available only to admin accounts."
        >
          <BrandButton label="Back To Account" onPress={() => router.replace('/account')} />
        </BrandHero>
      </BrandScreen>
    );
  }

  const donations = Array.isArray(donationsQuery.data) ? donationsQuery.data : [];

  const totalAmount = donations.reduce((sum: number, donation: any) => sum + Number(donation?.amount || 0), 0);
  const pendingCount = donations.filter((donation: any) =>
    ['pending', 'processing'].includes(String(donation?.status || '').toLowerCase()),
  ).length;

  return (
    <AdminShell activeTab="/admin-donations">
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#34D399', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Finance & Giving</ThemedText>
        </View>
        <View style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="download-outline" size={16} color={theme.text} />
        </View>
      </View>

      <View style={styles.totalCard}>
        <ThemedText type="smallBold" style={styles.totalEyebrow}>
          Total Received
        </ThemedText>
        <ThemedText type="title" style={{ color: '#FFFFFF' }}>
          ${totalAmount.toLocaleString()}
        </ThemedText>
        <View style={styles.totalMeta}>
          <View>
            <ThemedText type="small" style={styles.totalMetaLabel}>
              Records
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF' }}>
              {donations.length}
            </ThemedText>
          </View>
          <View>
            <ThemedText type="small" style={styles.totalMetaLabel}>
              Pending
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: '#FFFFFF' }}>
              {pendingCount}
            </ThemedText>
          </View>
        </View>
      </View>

      {donationsQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading donations...</ThemedText>
        </BrandCard>
      ) : donations.length === 0 ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No donations available</ThemedText>
          <ThemedText type="small">Donation records will show here when members give through ANT PRESS.</ThemedText>
        </BrandCard>
      ) : (
        donations.map((donation: any) => {
          const status = String(donation?.status || 'pending');
          const isPending = ['pending', 'processing'].includes(status.toLowerCase());

          return (
            <BrandCard key={String(donation?.id)}>
              <View style={styles.row}>
                <View style={styles.identityWrap}>
                  <View style={styles.moneyBadge}>
                    <Ionicons name="cash-outline" size={16} color="#34D399" />
                  </View>
                  <ThemedText type="defaultSemiBold">
                    {donation?.user?.email || donation?.email || `Donation #${donation?.id}`}
                  </ThemedText>
                </View>
                <BrandPill>{status}</BrandPill>
              </View>
              <ThemedText type="small">
                Amount: {typeof donation?.amount === 'number' ? donation.amount.toLocaleString() : donation?.amount || 0}
              </ThemedText>
              <ThemedText type="small">
                Type: {donation?.type || donation?.donation_type || 'general'} | Method: {donation?.payment_method || 'unknown'}
              </ThemedText>
              <ThemedText type="small">
                {donation?.created_at || donation?.createdAt || 'Recently created'}
              </ThemedText>

              {isPending ? (
                <View style={styles.actions}>
                  <BrandButton
                    label="Mark Completed"
                    onPress={() => updateDonationMutation.mutate({ id: Number(donation?.id), status: 'completed' })}
                    variant="secondary"
                  />
                  <BrandButton
                    label="Mark Failed"
                    onPress={() => updateDonationMutation.mutate({ id: Number(donation?.id), status: 'failed' })}
                    variant="outline"
                  />
                </View>
              ) : null}
            </BrandCard>
          );
        })
      )}
    </AdminShell>
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
  totalCard: {
    borderRadius: Radius.large,
    padding: Spacing.four,
    backgroundColor: '#047857',
    gap: Spacing.two,
  },
  totalEyebrow: {
    color: '#A7F3D0',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  totalMeta: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  totalMetaLabel: {
    color: '#A7F3D0',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  identityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  moneyBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(52,211,153,0.14)',
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
});
