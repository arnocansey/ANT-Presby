import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { LoadingList, Screen, ScreenHeader, SignInPrompt, StatGrid, StatTile, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Space } from '@/constants/tokens';
import { useAdminDonations, useUpdateDonationStatus } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

export default function AdminDonationsScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const donationsQuery = useAdminDonations(isAdmin);
  const updateDonationMutation = useUpdateDonationStatus();

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Admin giving" title="Finance and giving" />
        <SignInPrompt
          icon="shield-outline"
          title="Admin access requires sign in"
          message="Sign in with your ANT PRESS admin account to review donation records."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Admin giving" title="Finance and giving" />
        <EmptyState
          icon="lock-closed-outline"
          title="Admin access is restricted"
          message="This mobile donation review area is available only to admin accounts."
          action={<AppButton label="Back to account" onPress={() => router.replace('/account')} />}
        />
      </Screen>
    );
  }

  const donations = Array.isArray(donationsQuery.data) ? donationsQuery.data : [];

  const totalAmount = donations.reduce((sum: number, donation: any) => sum + Number(donation?.amount || 0), 0);
  const pendingCount = donations.filter((donation: any) =>
    ['pending', 'processing'].includes(String(donation?.status || '').toLowerCase()),
  ).length;

  return (
    <AdminShell activeTab="/admin-donations">
      <ScreenHeader back eyebrow="Admin" title="Finance and giving" />

      <AppCard>
        <AppText variant="caption" tone="gold" style={styles.eyebrow}>
          Total received
        </AppText>
        <AppText variant="title">{formatCedis(totalAmount)}</AppText>
      </AppCard>
      <StatGrid>
        <StatTile label="Records" value={donations.length} icon="receipt-outline" />
        <StatTile label="Pending" value={pendingCount} icon="time-outline" />
      </StatGrid>

      {donationsQuery.isLoading ? (
        <LoadingList />
      ) : donations.length === 0 ? (
        <EmptyState
          icon="cash-outline"
          title="No donations available"
          message="Donation records will show here when members give through ANT PRESS."
        />
      ) : (
        donations.map((donation: any) => {
          const status = String(donation?.status || 'pending');
          const isPending = ['pending', 'processing'].includes(status.toLowerCase());

          return (
            <AppCard key={String(donation?.id)}>
              <View style={styles.row}>
                <View style={[styles.money, { backgroundColor: colors.surface }]}>
                  <Ionicons name="cash-outline" size={18} color={colors.success} />
                </View>
                <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>
                  {donation?.user?.email || donation?.email || `Donation #${donation?.id}`}
                </AppText>
                <AppBadge tone={statusTone(status)}>{status}</AppBadge>
              </View>
              <AppText variant="small">Amount: {formatCedis(donation?.amount)}</AppText>
              <AppText variant="small" tone="muted">
                Type: {donation?.type || donation?.donation_type || 'general'} | Method: {donation?.payment_method || 'unknown'}
              </AppText>
              <AppText variant="small" tone="muted">
                {donation?.created_at || donation?.createdAt || 'Recently created'}
              </AppText>

              {isPending ? (
                <View style={styles.actions}>
                  <View style={styles.flex}>
                    <AppButton
                      label="Mark completed"
                      size="sm"
                      onPress={() => updateDonationMutation.mutate({ id: Number(donation?.id), status: 'completed' })}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppButton
                      label="Mark failed"
                      size="sm"
                      variant="danger"
                      onPress={() => updateDonationMutation.mutate({ id: Number(donation?.id), status: 'failed' })}
                    />
                  </View>
                </View>
              ) : null}
            </AppCard>
          );
        })
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  money: { width: 36, height: 36, borderRadius: Corner.pill, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm, marginTop: Space.xs },
});
