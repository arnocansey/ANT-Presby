import type { AlbumUploadSignature } from '@/hooks/use-api';

export const MAX_ALBUM_PHOTO_BYTES = 10 * 1024 * 1024;

export type PickedPhoto = { uri: string; mimeType?: string | null; fileName?: string | null; fileSize?: number | null };

// Multipart POST straight to Cloudinary with the server-issued signature; resolves to the public id.
// Plain fetch on purpose: apiClient would attach our auth token, which must never go to Cloudinary.
export const uploadPhotoToCloudinary = async (photo: PickedPhoto, signature: AlbumUploadSignature): Promise<string> => {
  const form = new FormData();
  form.append('file', {
    uri: photo.uri,
    name: photo.fileName || 'photo.jpg',
    type: photo.mimeType || 'image/jpeg',
  } as any);
  form.append('api_key', signature.apiKey);
  form.append('timestamp', String(signature.timestamp));
  form.append('signature', signature.signature);
  form.append('folder', signature.folder);
  form.append('allowed_formats', signature.allowedFormats);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || typeof body?.public_id !== 'string') {
    throw new Error(body?.error?.message || 'Upload failed');
  }
  return body.public_id;
};

// Runs worker over items with at most `limit` in flight; never rejects.
export const mapWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<PromiseSettledResult<R>[]> => {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { status: 'fulfilled', value: await worker(items[index], index) };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
};

export const chunk = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
};
