import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { useNews } from '@/hooks/use-api';
import { Spacing } from '@/constants/theme';

export default function NewsScreen() {
  const { data, isLoading } = useNews();
  const items = Array.isArray(data) ? data : [];
  const featured = items[0];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Sermons & Updates"
        title="Sermons"
        description="Watch, listen, and grow in faith through featured messages and platform announcements."
      />

      <View style={styles.filters}>
        <BrandPill>All</BrandPill>
        <BrandPill>Featured</BrandPill>
        <BrandPill>Recent</BrandPill>
      </View>

      {featured ? (
        <BrandCard>
          <BrandPill>Featured</BrandPill>
          <ThemedText type="defaultSemiBold">{featured.title}</ThemedText>
          <ThemedText type="small">{featured.summary || 'Featured message from ANT PRESS.'}</ThemedText>
          <BrandButton
            label="Open Featured"
            onPress={() => router.push(`/news/${featured.id}` as never)}
            variant="secondary"
          />
        </BrandCard>
      ) : null}

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
        items.slice(featured ? 1 : 0).map((item: any) => (
          <BrandCard key={item.id}>
            <BrandPill>{item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Published'}</BrandPill>
            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            <ThemedText type="small">{item.summary}</ThemedText>
            <BrandButton
              label="Read More"
              onPress={() => router.push(`/news/${item.id}` as never)}
              variant="secondary"
            />
          </BrandCard>
        ))
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
