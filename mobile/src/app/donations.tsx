import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandMetric, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { useMyDonations } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';
import { Spacing } from '@/constants/theme';

export default function DonationsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useMyDonations(Boolean(user));
  const donations = Array.isArray(data) ? data : [];
  const completed = donations.filter((item: any) => String(item.status || '').toLowerCase() === 'completed').length;

  if (!user) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Giving"
          title="Donation history"
          description="Sign in to see your giving history and payment statuses."
        >
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandHero>
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Giving"
        title="Donation history"
        description="Review your recent donations and their current statuses."
      >
        <BrandButton label="Make A Donation" onPress={() => router.push('/donate')} />
      </BrandHero>

      <View style={styles.metrics}>
        <BrandMetric label="Total" value={donations.length} />
        <BrandMetric label="Completed" value={completed} />
      </View>

      {isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading donations...</ThemedText>
        </BrandCard>
      ) : donations.length === 0 ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No donations yet</ThemedText>
          <ThemedText type="small">Your completed and pending giving activity will appear here.</ThemedText>
        </BrandCard>
      ) : (
        donations.map((item: any) => (
          <BrandCard key={item.id}>
            <BrandPill>{item.status || 'pending'}</BrandPill>
            <ThemedText type="defaultSemiBold">{`$${Number(item.amount || 0).toFixed(2)}`}</ThemedText>
            <ThemedText type="small">{item.donation_type || item.donationType || 'general'}</ThemedText>
            <ThemedText type="small">{item.payment_method || item.paymentMethod || 'payment'}</ThemedText>
            <ThemedText type="small">
              {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent donation'}
            </ThemedText>
          </BrandCard>
        ))
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
