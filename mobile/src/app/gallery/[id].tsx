import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandButton, BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAlbum, useAlbumDownloadUrl } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { savePhotoToLibrary } from '@/lib/save-photo';

export default function AlbumScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id) || undefined;
  const albumQuery = useAlbum(id);
  const downloadUrl = useAlbumDownloadUrl();
  const [viewing, setViewing] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const album = albumQuery.data;
  const photos = album?.photos ?? [];
  const current = viewing !== null ? photos[viewing] : undefined;

  const openInBrowser = async (url?: string | null) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open the link', 'Please try again.');
    }
  };

  const downloadAll = async () => {
    if (!id || downloadUrl.isPending) return;
    try {
      await openInBrowser(await downloadUrl.mutateAsync(id));
    } catch (error) {
      Alert.alert('Could not prepare the download', getApiErrorMessage(error, 'Please try again.'));
    }
  };

  const saveCurrent = async () => {
    if (!current || !album || saving) return;
    setSaving(true);
    try {
      const result = await savePhotoToLibrary(album.id, current);
      if (result === 'denied') {
        Alert.alert('Photo access needed', 'Allow ANT PRESS to add photos in your phone settings, then try again.');
      } else {
        Alert.alert('Saved', 'The photo is in your photo library.');
      }
    } catch {
      Alert.alert('Could not save the photo', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const step = (by: number) => setViewing((index) => (index === null ? index : (index + by + photos.length) % photos.length));

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
        </View>
      </View>

      {albumQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : !album ? (
        <BrandCard>
          <ThemedText type="small">Album not found.</ThemedText>
        </BrandCard>
      ) : (
        <>
          <ThemedText type="subtitle">{album.title}</ThemedText>
          {album.description ? <ThemedText themeColor="textSecondary">{album.description}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary">
            {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
            {album.event_name ? ` · ${album.event_name}` : ''}
          </ThemedText>
          <View style={styles.actions}>
            {photos.length > 0 ? (
              <BrandButton label={downloadUrl.isPending ? 'Preparing...' : 'Download All'} onPress={downloadAll} />
            ) : null}
            {album.external_url ? <BrandButton label="Open Folder" variant="outline" onPress={() => openInBrowser(album.external_url)} /> : null}
          </View>

          {photos.length === 0 ? (
            <BrandCard>
              <ThemedText type="small" themeColor="textSecondary">
                No photos yet.
              </ThemedText>
            </BrandCard>
          ) : (
            <View style={styles.grid}>
              {photos.map((photo, index) => (
                <Pressable key={photo.id} onPress={() => setViewing(index)} style={styles.cell}>
                  <Image source={{ uri: photo.thumb_url }} style={styles.thumb} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <Modal visible={Boolean(current)} animationType="fade" onRequestClose={() => setViewing(null)}>
        <SafeAreaView style={styles.viewer}>
          <View style={styles.viewerBar}>
            <ThemedText style={styles.viewerText}>
              {viewing !== null ? `${viewing + 1} / ${photos.length}` : ''}
            </ThemedText>
            <Pressable onPress={() => setViewing(null)} hitSlop={12}>
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </Pressable>
          </View>
          {current ? <Image source={{ uri: current.url }} style={styles.viewerImage} contentFit="contain" /> : null}
          <View style={styles.viewerBar}>
            <Pressable onPress={() => step(-1)} hitSlop={12} disabled={photos.length < 2}>
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </Pressable>
            <BrandButton label={saving ? 'Saving...' : 'Save to Photos'} onPress={saveCurrent} />
            <Pressable onPress={() => step(1)} hitSlop={12} disabled={photos.length < 2}>
              <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: '32.5%', aspectRatio: 1 },
  thumb: { width: '100%', height: '100%', borderRadius: Radius.small },
  viewer: { flex: 1, backgroundColor: '#000000' },
  viewerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.three },
  viewerText: { color: '#FFFFFF' },
  viewerImage: { flex: 1 },
});
