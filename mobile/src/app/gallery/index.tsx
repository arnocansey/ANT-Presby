import { router } from 'expo-router';
import React from 'react';

import { ErrorState, LoadingList, MediaFrame, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner } from '@/constants/tokens';
import { useAlbums } from '@/hooks/use-api';

export default function GalleryScreen() {
  const albumsQuery = useAlbums();
  const albums = albumsQuery.data ?? [];

  return (
    <Screen>
      <ScreenHeader back title="Gallery" subtitle="Photos from our services and events" />

      {albumsQuery.isLoading ? (
        <LoadingList count={2} height={240} />
      ) : albumsQuery.isError ? (
        <ErrorState title="Could not load the gallery" onRetry={() => albumsQuery.refetch()} />
      ) : albums.length === 0 ? (
        <EmptyState icon="images-outline" title="No albums yet" message="Photo albums from services and events will appear here." />
      ) : (
        albums.map((album) => (
          <AppCard key={album.id} onPress={() => router.push(`/gallery/${album.id}` as never)} accessibilityLabel={`Open album ${album.title}`}>
            <MediaFrame uri={album.cover_url} icon="images-outline" height={180} radius={Corner.control} />
            <AppText variant="bodyStrong" numberOfLines={1}>
              {album.title}
            </AppText>
            <AppText variant="small" tone="muted">
              {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
              {album.event_name ? ` · ${album.event_name}` : ''} · {new Date(album.created_at).toLocaleDateString()}
            </AppText>
          </AppCard>
        ))
      )}
    </Screen>
  );
}
