import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Fixed, MIN_TOUCH, Space } from '@/constants/tokens';
import { getApiErrorMessage, useAlbum, useAlbumDownloadUrl } from '@/hooks/use-api';
import { savePhotoToLibrary } from '@/lib/save-photo';

export default function AlbumScreen() {
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
    <Screen>
      <ScreenHeader back eyebrow="Gallery" title={album?.title || 'Album'} subtitle={album?.description || undefined} />

      {albumQuery.isLoading ? (
        <LoadingList count={2} height={160} />
      ) : !album ? (
        <EmptyState icon="images-outline" title="Album not found" message="It may have been unpublished or removed." />
      ) : (
        <>
          <AppText variant="small" tone="muted">
            {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
            {album.event_name ? ` · ${album.event_name}` : ''}
          </AppText>
          <View style={styles.actions}>
            {photos.length > 0 ? (
              <View style={styles.action}>
                <AppButton label={downloadUrl.isPending ? 'Preparing...' : 'Download all'} onPress={downloadAll} />
              </View>
            ) : null}
            {album.external_url ? (
              <View style={styles.action}>
                <AppButton label="Open folder" variant="secondary" onPress={() => openInBrowser(album.external_url)} />
              </View>
            ) : null}
          </View>

          {photos.length === 0 ? (
            <EmptyState icon="image-outline" title="No photos yet" />
          ) : (
            <View style={styles.grid}>
              {photos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setViewing(index)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Open photo ${index + 1} of ${photos.length}`}
                  style={styles.cell}>
                  <Image source={{ uri: photo.thumb_url }} style={styles.thumb} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <Modal visible={Boolean(current)} animationType="fade" onRequestClose={() => setViewing(null)}>
        <SafeAreaView style={[styles.viewer, { backgroundColor: Fixed.viewer }]}>
          <View style={styles.viewerBar}>
            <AppText style={{ color: Fixed.onMedia }}>
              {viewing !== null ? `${viewing + 1} / ${photos.length}` : ''}
            </AppText>
            <Pressable onPress={() => setViewing(null)} accessibilityRole="button" accessibilityLabel="Close photo" style={styles.viewerIcon}>
              <Ionicons name="close" size={26} color={Fixed.onMedia} />
            </Pressable>
          </View>
          {current ? <Image source={{ uri: current.url }} style={styles.viewerImage} contentFit="contain" /> : null}
          <View style={styles.viewerBar}>
            <Pressable
              onPress={() => step(-1)}
              disabled={photos.length < 2}
              accessibilityRole="button"
              accessibilityLabel="Previous photo"
              style={styles.viewerIcon}>
              <Ionicons name="chevron-back" size={28} color={Fixed.onMedia} />
            </Pressable>
            <AppButton label={saving ? 'Saving...' : 'Save to Photos'} variant="secondary" onPress={saveCurrent} />
            <Pressable
              onPress={() => step(1)}
              disabled={photos.length < 2}
              accessibilityRole="button"
              accessibilityLabel="Next photo"
              style={styles.viewerIcon}>
              <Ionicons name="chevron-forward" size={28} color={Fixed.onMedia} />
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  action: { flexGrow: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.xs },
  cell: { width: '32.5%', aspectRatio: 1 },
  thumb: { width: '100%', height: '100%', borderRadius: Corner.control },
  viewer: { flex: 1 },
  viewerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Space.md },
  viewerIcon: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  viewerImage: { flex: 1 },
});
