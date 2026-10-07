import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAdminAlbums, useSaveAlbum } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminGalleryScreen() {
  const theme = useTheme();
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
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#F59E0B', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Photo Gallery</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="defaultSemiBold">New album</ThemedText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Album title"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
        />
        <BrandButton label={save.isPending ? 'Creating...' : 'Create Draft Album'} variant="secondary" onPress={onCreate} />
      </BrandCard>

      {albums.map((album) => (
        <Pressable key={album.id} onPress={() => router.push(`/admin-gallery/${album.id}` as never)}>
          <BrandCard>
            <View style={styles.row}>
              {album.cover_url ? (
                <Image source={{ uri: album.cover_url }} style={styles.thumb} contentFit="cover" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]} />
              )}
              <View style={styles.rowCopy}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>
                  {album.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                  {album.notified_at ? ' · everyone notified' : ''}
                </ThemedText>
              </View>
              <BrandPill>{album.is_published ? 'published' : 'draft'}</BrandPill>
            </View>
          </BrandCard>
        </Pressable>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowCopy: { flex: 1, gap: 2 },
  thumb: { width: 56, height: 56, borderRadius: Radius.medium },
});
