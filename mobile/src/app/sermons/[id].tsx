import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { InfoLine, LoadingList, MediaFrame, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import { useSermonById } from '@/hooks/use-api';

export default function SermonDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const sermonId = params.id;
  const sermonQuery = useSermonById(sermonId);
  const sermon = sermonQuery.data;
  const videoUrl = sermon?.video_url || sermon?.videoUrl;

  return (
    <Screen>
      <ScreenHeader back eyebrow={sermon?.series || 'Sermon'} title={sermon?.title || 'Sermon'} />

      {sermonQuery.isLoading ? (
        <LoadingList count={2} height={140} />
      ) : sermon ? (
        <>
          <MediaFrame icon="play-circle-outline" height={200} />
          <View style={styles.meta}>
            <AppBadge>{sermon?.speaker || 'Speaker not listed'}</AppBadge>
            <AppText variant="small" tone="muted">
              {sermon?.sermon_date ? new Date(sermon.sermon_date).toLocaleDateString() : 'Date unavailable'}
            </AppText>
          </View>
          <AppText>{sermon?.description || 'No description provided.'}</AppText>
          <AppCard>
            <AppText variant="bodyStrong">Video</AppText>
            {videoUrl ? (
              <InfoLine icon="videocam-outline" selectable>
                {videoUrl}
              </InfoLine>
            ) : (
              <AppText variant="small" tone="muted">
                No video link attached yet.
              </AppText>
            )}
          </AppCard>
        </>
      ) : (
        <EmptyState icon="play-circle-outline" title="Sermon not found" message="It may have been removed." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
});
