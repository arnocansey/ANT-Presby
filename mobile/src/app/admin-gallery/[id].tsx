import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ChipGroup, IconButton, LoadingList, ScreenHeader, SwitchRow } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { Corner, Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAdminAlbum,
  useAdminEvents,
  useAlbumUploadSignature,
  useDeleteAlbum,
  useDeleteAlbumPhoto,
  useRecordAlbumPhotos,
  useSaveAlbum,
  useSetAlbumCover,
  type AlbumPhoto,
} from '@/hooks/use-api';
import { MAX_ALBUM_PHOTO_BYTES, chunk, mapWithConcurrency, uploadPhotoToCloudinary, type PickedPhoto } from '@/lib/album-upload';
import { useAuthStore } from '@/store/auth';

type FormState = { title: string; description: string; externalUrl: string; eventId: number | null; isPublished: boolean };

export default function AdminAlbumScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id) || undefined;
  const albumQuery = useAdminAlbum(id, isAdmin);
  const eventsQuery = useAdminEvents(isAdmin);
  const save = useSaveAlbum();
  const removeAlbum = useDeleteAlbum();
  const getSignature = useAlbumUploadSignature(id);
  const recordPhotos = useRecordAlbumPhotos(id);
  const removePhoto = useDeleteAlbumPhoto(id);
  const setCover = useSetAlbumCover(id);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [retryPhotos, setRetryPhotos] = React.useState<PickedPhoto[]>([]);
  // Uploaded to Cloudinary but not yet recorded: retried by id, never uploaded twice.
  const [retryIds, setRetryIds] = React.useState<string[]>([]);
  const album = albumQuery.data;

  React.useEffect(() => {
    if (!album) return;
    setForm({
      title: album.title,
      description: album.description || '',
      externalUrl: album.external_url || '',
      eventId: album.event_id,
      isPublished: album.is_published,
    });
    // Only when a different album loads, so typing is not overwritten by refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album?.id]);

  if (!user || !isAdmin) return null;

  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));

  const onSave = () => {
    if (!form || !id || save.isPending) return;
    if (!form.title.trim()) {
      Alert.alert('Missing title', 'The album needs a title.');
      return;
    }
    save.mutate(
      {
        id,
        input: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventId: form.eventId,
          externalUrl: form.externalUrl.trim() || null,
          isPublished: form.isPublished,
        },
      },
      { onSuccess: ({ message }) => Alert.alert(message || 'Album saved'), onError: showError('Could not save') }
    );
  };

  // Records uploaded ids, 100 per request. Refused ids are final (wrong type or too big); ids whose
  // request failed are returned so a retry can record them without uploading the photos again.
  const recordIds = async (publicIds: string[]) => {
    let added = 0;
    let refused = 0;
    const unrecorded: string[] = [];
    for (const ids of chunk(publicIds, 100)) {
      try {
        const result = await recordPhotos.mutateAsync(ids);
        added += result.added;
        refused += result.rejected.length;
      } catch (error: any) {
        const rejected = error?.response?.status === 400 ? error.response.data?.data?.rejected : undefined;
        if (Array.isArray(rejected)) refused += rejected.length;
        else unrecorded.push(...ids);
      }
    }
    return { added, refused, unrecorded };
  };

  // Uploads straight to Cloudinary, 3 at a time, then records the uploaded ids (plus any left from a failed record).
  const uploadPhotos = async (picked: PickedPhoto[], unrecordedIds: string[] = []) => {
    if ((picked.length === 0 && unrecordedIds.length === 0) || progress) return;
    const tooBig = picked.filter((photo) => (photo.fileSize ?? 0) > MAX_ALBUM_PHOTO_BYTES);
    const ready = picked.filter((photo) => (photo.fileSize ?? 0) <= MAX_ALBUM_PHOTO_BYTES);
    if (tooBig.length > 0) Alert.alert('Some photos skipped', `${tooBig.length} photo(s) are over 10 MB.`);
    if (ready.length === 0 && unrecordedIds.length === 0) return;

    setRetryPhotos([]);
    setRetryIds([]);
    setProgress({ done: 0, total: ready.length });
    try {
      const uploadedIds = [...unrecordedIds];
      const failedUploads: PickedPhoto[] = [];
      if (ready.length > 0) {
        const signature = await getSignature.mutateAsync();
        const results = await mapWithConcurrency(ready, 3, async (photo) => {
          try {
            return await uploadPhotoToCloudinary(photo, signature);
          } finally {
            setProgress((current) => (current ? { ...current, done: current.done + 1 } : current));
          }
        });
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') uploadedIds.push(result.value);
          else failedUploads.push(ready[index]);
        });
      }

      const { added, refused, unrecorded } = await recordIds(uploadedIds);
      setRetryPhotos(failedUploads);
      setRetryIds(unrecorded);

      const total = ready.length + unrecordedIds.length;
      const retryable = failedUploads.length + unrecorded.length;
      const details = [
        refused > 0 ? `${refused} not accepted (wrong type or over 10 MB).` : '',
        retryable > 0 ? `Tap "Retry failed" to try ${retryable} again.` : '',
      ]
        .filter(Boolean)
        .join(' ');
      Alert.alert(`${added} of ${total} added`, details);
    } catch (error) {
      showError('Could not start the upload')(error);
    } finally {
      setProgress(null);
    }
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 100,
      quality: 0.9,
    });
    if (result.canceled) return;
    uploadPhotos(result.assets ?? []);
  };

  const confirmDeletePhoto = (photo: AlbumPhoto) =>
    Alert.alert('Delete this photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removePhoto.mutate(photo.id, { onError: showError('Could not delete') }) },
    ]);

  const confirmDeleteAlbum = () =>
    Alert.alert(`Delete "${album?.title}"?`, 'All of its photos are deleted too. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          id && removeAlbum.mutate(id, { onSuccess: () => router.replace('/admin-gallery' as never), onError: showError('Could not delete') }),
      },
    ]);

  const events: { id: number; name: string }[] = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];
  const field = (key: 'title' | 'description' | 'externalUrl', label: string, placeholder: string, multiline = false) => (
    <TextField
      label={label}
      value={form ? form[key] : ''}
      onChangeText={(value) => setForm((current) => (current ? { ...current, [key]: value } : current))}
      placeholder={placeholder}
      multiline={multiline}
      autoCapitalize={key === 'externalUrl' ? 'none' : 'sentences'}
    />
  );

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader back eyebrow="Album" title={album?.title || 'Loading...'} />

      {!album || !form ? (
        albumQuery.isLoading ? (
          <LoadingList count={2} height={160} />
        ) : (
          <EmptyState icon="images-outline" title="Album not found" />
        )
      ) : (
        <>
          <AppCard>
            <AppText variant="section">Details</AppText>
            {field('title', 'Title', 'Title')}
            {field('description', 'Description (optional)', 'Description', true)}
            {field('externalUrl', 'Outside folder link (optional)', 'https://…')}
            <AppText variant="small" style={styles.bold}>
              Event
            </AppText>
            <ChipGroup
              scroll
              options={[{ value: 0, label: 'No event' }, ...events.map((item) => ({ value: item.id, label: item.name }))]}
              value={form.eventId ?? 0}
              onChange={(value) => setForm((current) => (current ? { ...current, eventId: value || null } : current))}
            />
            <SwitchRow
              label="Published"
              value={form.isPublished}
              onValueChange={(value) => setForm((current) => (current ? { ...current, isPublished: value } : current))}
            />
            <AppButton label={save.isPending ? 'Saving...' : 'Save'} onPress={onSave} />
          </AppCard>

          <AppCard>
            <AppText variant="section">{`Photos (${album.photo_count})`}</AppText>
            <AppText variant="small" tone="muted">
              {progress ? `Uploading ${progress.done} of ${progress.total}...` : 'Up to 10 MB each. Choose several at once.'}
            </AppText>
            <AppButton label={progress ? 'Uploading...' : 'Add photos'} onPress={() => !progress && pickPhotos()} />
            {retryPhotos.length + retryIds.length > 0 && !progress ? (
              <AppButton
                label={`Retry ${retryPhotos.length + retryIds.length} failed`}
                variant="secondary"
                onPress={() => uploadPhotos(retryPhotos, retryIds)}
              />
            ) : null}
            <View style={styles.grid}>
              {album.photos.map((photo, index) => {
                const isCover = album.cover_photo_id ? album.cover_photo_id === photo.id : album.photos[0]?.id === photo.id;
                return (
                  <View key={photo.id} style={styles.cell}>
                    <Image source={{ uri: photo.thumb_url }} style={styles.thumb} contentFit="cover" />
                    <View style={styles.cellActions}>
                      <IconButton
                        icon={isCover ? 'star' : 'star-outline'}
                        variant="ghost"
                        accessibilityLabel={isCover ? `Photo ${index + 1} is the cover` : `Make photo ${index + 1} the cover`}
                        onPress={() => !isCover && setCover.mutate(photo.id, { onError: showError('Could not set the cover') })}
                      />
                      <IconButton
                        icon="trash-outline"
                        variant="ghost"
                        accessibilityLabel={`Delete photo ${index + 1}`}
                        onPress={() => confirmDeletePhoto(photo)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </AppCard>

          <AppButton label="Delete album" variant="danger" onPress={confirmDeleteAlbum} />
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  cell: { width: '31%', gap: 2 },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: Corner.control },
  cellActions: { flexDirection: 'row', justifyContent: 'space-around' },
});
