import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

import type { AlbumPhoto } from '@/hooks/use-api';

// Downloads the original photo to the cache, then saves it to the phone's photo library.
export const savePhotoToLibrary = async (albumId: number, photo: AlbumPhoto): Promise<'saved' | 'denied'> => {
  const permission = await MediaLibrary.requestPermissionsAsync(true, ['photo']);
  if (!permission.granted) return 'denied';

  const extension = (photo.format || 'jpg').toLowerCase();
  const target = new File(Paths.cache, `album-${albumId}-photo-${photo.id}.${extension}`);
  const downloaded = await File.downloadFileAsync(photo.download_url, target, { idempotent: true });
  try {
    await MediaLibrary.saveToLibraryAsync(downloaded.uri);
  } finally {
    try {
      downloaded.delete();
    } catch {
      // The cache is cleared by the system anyway.
    }
  }
  return 'saved';
};
