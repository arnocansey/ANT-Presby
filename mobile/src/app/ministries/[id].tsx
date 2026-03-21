import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { useMinistrySermons } from '@/hooks/use-api';

export default function MinistryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const ministryId = params.id;
  const sermonsQuery = useMinistrySermons(ministryId);
  const sermons = sermonsQuery.data || [];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Ministry Sermons"
        title="Messages from this ministry"
        description="A focused sermon list for the selected ministry, matching the website ministry detail flow."
      />

      {sermonsQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading sermons...</ThemedText>
        </BrandCard>
      ) : sermons.length > 0 ? (
        sermons.map((sermon: any) => (
          <BrandCard key={String(sermon?.id)}>
            <BrandPill>{sermon?.speaker || 'Sermon'}</BrandPill>
            <ThemedText type="defaultSemiBold">{sermon?.title || 'Untitled sermon'}</ThemedText>
            <ThemedText type="small">{sermon?.description || 'No description provided.'}</ThemedText>
            <BrandButton
              label="Open Sermon"
              onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
              variant="secondary"
            />
          </BrandCard>
        ))
      ) : (
        <BrandCard>
          <ThemedText type="small">No sermons found for this ministry.</ThemedText>
        </BrandCard>
      )}
    </BrandScreen>
  );
}
