import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import { useNews } from '@/hooks/use-api';

export default function NewsScreen() {
  const { data, isLoading, isError, refetch } = useNews();
  const items = Array.isArray(data) ? data : [];

  return (
    <Screen>
      <ScreenHeader back title="News" subtitle="Updates and announcements from the church" />

      {isLoading ? (
        <LoadingList />
      ) : isError ? (
        <ErrorState title="Could not load news" onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="newspaper-outline" title="No news yet" message="Posts published by the church will appear here." />
      ) : (
        items.map((item: any, index: number) => (
          <AppCard
            key={String(item.id)}
            onPress={() => router.push(`/news/${item.id}` as never)}
            accessibilityLabel={`Read ${item.title}`}>
            <View style={styles.meta}>
              {index === 0 ? <AppBadge tone="gold">Featured</AppBadge> : null}
              <AppText variant="caption" tone="muted">
                {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Published'}
              </AppText>
            </View>
            <AppText variant="bodyStrong">{item.title}</AppText>
            {item.summary ? (
              <AppText variant="small" tone="muted" numberOfLines={3}>
                {item.summary}
              </AppText>
            ) : null}
            <AppText variant="small" tone="link">
              Read more
            </AppText>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});
