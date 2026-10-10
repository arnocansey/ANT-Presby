import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ChipGroup,
  ErrorState,
  IconButton,
  ListGroup,
  ListRow,
  LoadingList,
  MediaFrame,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/kit';
import { LiveCard } from '@/components/live-card';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import { useSermons, useSermonSeriesList } from '@/hooks/use-api';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '');

// The Watch tab: live card while live, series filter, the latest sermon, then recent messages.
export default function SermonsScreen() {
  const [selectedSeriesId, setSelectedSeriesId] = React.useState<number | undefined>();
  const sermonsQuery = useSermons(1, 12, true, selectedSeriesId);
  const seriesQuery = useSermonSeriesList();
  const sermons = Array.isArray(sermonsQuery.data) ? sermonsQuery.data : [];
  const seriesOptions = [
    { value: undefined as number | undefined, label: 'All' },
    ...(seriesQuery.data || []).map((item) => ({ value: item.id as number | undefined, label: item.title })),
  ];
  const featured = sermons[0];
  const recent = featured ? sermons.slice(1) : sermons;

  return (
    <Screen>
      <ScreenHeader
        title="Watch"
        subtitle="Live services, sermons and series"
        right={
          <IconButton
            icon="search-outline"
            accessibilityLabel="Search sermons and events"
            onPress={() => router.push('/search' as never)}
          />
        }
      />

      <LiveCard />

      {seriesOptions.length > 1 ? (
        <>
          <SectionHeader title="Series" />
          <ChipGroup scroll options={seriesOptions} value={selectedSeriesId} onChange={setSelectedSeriesId} />
        </>
      ) : null}

      {sermonsQuery.isLoading ? (
        <LoadingList count={3} height={96} />
      ) : sermonsQuery.isError ? (
        <ErrorState title="Could not load sermons" onRetry={() => sermonsQuery.refetch()} />
      ) : !featured ? (
        <EmptyState
          icon="play-circle-outline"
          title="No sermons yet"
          message={selectedSeriesId ? 'This series has no sermons yet.' : 'New sermons will appear here.'}
        />
      ) : (
        <>
          <SectionHeader title="Latest sermon" />
          <AppCard
            onPress={() => router.push(`/sermons/${featured.id}` as never)}
            accessibilityLabel={`Latest sermon: ${featured.title || 'Untitled sermon'}`}
            style={styles.featured}>
            <MediaFrame icon="play-circle-outline" height={168} radius={0} />
            <View style={styles.featuredBody}>
              {featured.series_title ? <AppBadge tone="gold">{String(featured.series_title)}</AppBadge> : null}
              <AppText variant="section">{featured.title || 'Untitled sermon'}</AppText>
              <AppText variant="small" tone="muted">
                {[featured.speaker || 'Speaker unavailable', formatDate(featured.sermon_date)].filter(Boolean).join(' · ')}
              </AppText>
            </View>
          </AppCard>

          {recent.length > 0 ? (
            <>
              <SectionHeader title="Recent messages" actionLabel="Search" onAction={() => router.push('/search' as never)} />
              <ListGroup>
                {recent.map((sermon: any) => (
                  <ListRow
                    key={String(sermon?.id)}
                    icon="play-outline"
                    label={sermon?.title || 'Untitled sermon'}
                    description={[sermon?.series_title, sermon?.speaker, sermon?.duration].filter(Boolean).join(' · ') || undefined}
                    onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
                  />
                ))}
              </ListGroup>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  featured: { padding: 0, gap: 0, overflow: 'hidden' },
  featuredBody: { padding: Space.md, gap: Space.xs },
});
