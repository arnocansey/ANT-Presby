import React from 'react';

import { BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { useNews } from '@/hooks/use-api';

export default function NewsScreen() {
  const { data, isLoading } = useNews();
  const items = Array.isArray(data) ? data : [];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Announcements"
        title="News and updates"
        description="Published content from ANT PRESS, styled to mirror the website experience."
      />

      {isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading news...</ThemedText>
        </BrandCard>
      ) : items.length === 0 ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No published news yet</ThemedText>
          <ThemedText type="small">Posts created in the admin panel will appear here.</ThemedText>
        </BrandCard>
      ) : (
        items.map((item: any) => (
          <BrandCard key={item.id}>
            <BrandPill>{item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Published'}</BrandPill>
            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            <ThemedText type="small">{item.summary}</ThemedText>
          </BrandCard>
        ))
      )}
    </BrandScreen>
  );
}
