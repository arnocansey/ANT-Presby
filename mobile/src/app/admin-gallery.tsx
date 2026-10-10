import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Corner, Space } from '@/constants/tokens';
import { getApiErrorMessage, useAdminAlbums, useSaveAlbum } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminGalleryScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const albumsQuery = useAdminAlbums(isAdmin);
  const save = useSaveAlbum();
  const [title, setTitle] = React.useState('');

  if (!user || !isAdmin) return null;

  // New albums start as drafts; the details, photos and publishing are on the album screen.
  const onCreate = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give the album a title first.');
      return;
    }
    if (save.isPending) return;
    save.mutate(
      { input: { title: title.trim(), description: null, eventId: null, externalUrl: null, isPublished: false } },
      {
        onSuccess: ({ album }) => {
          setTitle('');
          if (album?.id) router.push(`/admin-gallery/${album.id}` as never);
        },
        onError: (error) => Alert.alert('Could not create the album', getApiErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const albums = albumsQuery.data ?? [];

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader back eyebrow="Admin" title="Gallery" />

      <AppCard>
        <AppText variant="bodyStrong">New album</AppText>
        <TextField label="Album title" value={title} onChangeText={setTitle} placeholder="Album title" />
        <AppButton label={save.isPending ? 'Creating...' : 'Create draft album'} onPress={onCreate} />
      </AppCard>

      {albums.map((album) => (
        <AppCard
          key={album.id}
          onPress={() => router.push(`/admin-gallery/${album.id}` as never)}
          accessibilityLabel={`Open album ${album.title}`}
          style={styles.row}>
          {album.cover_url ? (
            <Image source={{ uri: album.cover_url }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: colors.surface }]} />
          )}
          <View style={styles.flex}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {album.title}
            </AppText>
            <AppText variant="small" tone="muted">
              {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
              {album.notified_at ? ' · everyone notified' : ''}
            </AppText>
          </View>
          <AppBadge tone={album.is_published ? 'success' : 'warning'}>{album.is_published ? 'published' : 'draft'}</AppBadge>
        </AppCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  thumb: { width: 56, height: 56, borderRadius: Corner.control },
  flex: { flex: 1, gap: 2 },
});
