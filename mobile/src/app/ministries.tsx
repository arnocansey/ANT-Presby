import { router } from 'expo-router';
import React from 'react';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { useMinistries } from '@/hooks/use-api';

export default function MinistriesScreen() {
  const ministriesQuery = useMinistries();
  const ministries = ministriesQuery.data || [];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Ministries"
        title="Serve, grow, and connect"
        description="Explore the same ministries available on the ANT PRESS website and open the sermon collections for each one."
      />

      {ministriesQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading ministries...</ThemedText>
        </BrandCard>
      ) : ministries.length > 0 ? (
        ministries.map((ministry: any) => (
          <BrandCard key={String(ministry?.id)}>
            <BrandPill>Ministry</BrandPill>
            <ThemedText type="defaultSemiBold">{ministry?.name || 'Ministry'}</ThemedText>
            <ThemedText type="small">{ministry?.description || 'No ministry description provided yet.'}</ThemedText>
            <BrandButton
              label="View Sermons"
              onPress={() => router.push(`/ministries/${ministry?.id}` as never)}
              variant="secondary"
            />
          </BrandCard>
        ))
      ) : (
        <BrandCard>
          <ThemedText type="small">No ministries available right now.</ThemedText>
        </BrandCard>
      )}
    </BrandScreen>
  );
}
