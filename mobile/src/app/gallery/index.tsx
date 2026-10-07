import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAlbums } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

export default function GalleryScreen() {
  const theme = useTheme();
  const albumsQuery = useAlbums();
  const albums = albumsQuery.data ?? [];

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: theme.tint, textTransform: 'uppercase', letterSpacing: 1 }}>
            Photo Gallery
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Photos from our services and events
          </ThemedText>
        </View>
      </View>

      {albumsQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : albumsQuery.isError ? (
        <BrandCard>
          <ThemedText type="small">Could not load the gallery.</ThemedText>
          <BrandButton label="Try again" onPress={() => albumsQuery.refetch()} />
        </BrandCard>
      ) : albums.length === 0 ? (
        <BrandCard>
          <ThemedText type="small" themeColor="textSecondary">
            No albums yet.
          </ThemedText>
        </BrandCard>
      ) : (
        albums.map((album) => (
          <Pressable key={album.id} onPress={() => router.push(`/gallery/${album.id}` as never)}>
            <BrandCard>
              {album.cover_url ? (
                <Image source={{ uri: album.cover_url }} style={styles.cover} contentFit="cover" />
              ) : (
                <View style={[styles.cover, { backgroundColor: theme.backgroundSelected }]} />
              )}
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {album.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                {album.event_name ? ` · ${album.event_name}` : ''} · {new Date(album.created_at).toLocaleDateString()}
              </ThemedText>
            </BrandCard>
          </Pressable>
        ))
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cover: { width: '100%', height: 180, borderRadius: Radius.medium },
});
