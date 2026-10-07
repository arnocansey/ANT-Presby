'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Star, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminAlbum,
  useAdminEvents,
  useAlbumUploadSignature,
  useDeleteAlbum,
  useDeleteAlbumPhoto,
  useRecordAlbumPhotos,
  useSaveAlbum,
  useSetAlbumCover,
  type AlbumPhoto,
} from '@/hooks/useApi';
import { MAX_ALBUM_PHOTO_BYTES, chunk, mapWithConcurrency, uploadToCloudinary } from '@/lib/albumUpload';

type FormState = { title: string; description: string; eventId: string; externalUrl: string; isPublished: boolean };

export default function AdminAlbumPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params?.id) || undefined;
  const { data: album, isLoading } = useAdminAlbum(id);
  const { data: events } = useAdminEvents();
  const save = useSaveAlbum();
  const removeAlbum = useDeleteAlbum();
  const getSignature = useAlbumUploadSignature(id);
  const recordPhotos = useRecordAlbumPhotos(id);
  const removePhoto = useDeleteAlbumPhoto(id);
  const setCover = useSetAlbumCover(id);

  const [form, setForm] = React.useState<FormState | null>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [retryFiles, setRetryFiles] = React.useState<File[]>([]);
  const [dragging, setDragging] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [pendingPhoto, setPendingPhoto] = React.useState<AlbumPhoto | null>(null);
  const fileInput = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!album) return;
    setForm({
      title: album.title,
      description: album.description || '',
      eventId: album.event_id ? String(album.event_id) : '',
      externalUrl: album.external_url || '',
      isPublished: album.is_published,
    });
    // Only when a different album loads, so typing is not overwritten by refetches.
  }, [album?.id]);

  const set = (field: 'title' | 'description' | 'eventId' | 'externalUrl') =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((current) => (current ? { ...current, [field]: event.target.value } : current));

  const onSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form || !id) return;
    save.mutate({
      id,
      input: {
        title: form.title.trim(),
        description: form.description.trim() || null,
        eventId: form.eventId ? Number(form.eventId) : null,
        externalUrl: form.externalUrl.trim() || null,
        isPublished: form.isPublished,
      },
    });
  };

  // Uploads straight to Cloudinary, 4 at a time, then records the uploaded ids (100 per request).
  const uploadFiles = async (files: File[]) => {
    if (files.length === 0 || progress) return;
    const tooBig = files.filter((file) => file.size > MAX_ALBUM_PHOTO_BYTES);
    const ready = files.filter((file) => file.size <= MAX_ALBUM_PHOTO_BYTES);
    if (tooBig.length > 0) toast.error(`${tooBig.length} photo(s) are over 10 MB and were skipped`);
    if (ready.length === 0) return;

    setRetryFiles([]);
    setProgress({ done: 0, total: ready.length });
    try {
      const signature = await getSignature.mutateAsync();
      const results = await mapWithConcurrency(ready, 4, async (file) => {
        try {
          return await uploadToCloudinary(file, signature);
        } finally {
          setProgress((current) => (current ? { ...current, done: current.done + 1 } : current));
        }
      });

      const fileById = new Map<string, File>();
      const failed: File[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') fileById.set(result.value, ready[index]);
        else failed.push(ready[index]);
      });

      let added = 0;
      for (const ids of chunk([...fileById.keys()], 100)) {
        try {
          const result = await recordPhotos.mutateAsync(ids);
          added += result.added;
          result.rejected.forEach((publicId) => {
            const file = fileById.get(publicId);
            if (file) failed.push(file);
          });
        } catch {
          ids.forEach((publicId) => failed.push(fileById.get(publicId) as File));
        }
      }

      setRetryFiles(failed);
      const message = `${added} of ${ready.length} uploaded`;
      if (failed.length > 0) toast.error(`${message}. You can retry the failed photos.`);
      else toast.success(message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not start the upload');
    } finally {
      setProgress(null);
    }
  };

  if (isLoading || (album && !form)) {
    return <div className="container-max py-12 text-sm text-ui-subtle">Loading album...</div>;
  }
  if (!album || !form || !id) {
    return <div className="container-max py-12 text-sm text-ui-subtle">Album not found.</div>;
  }

  return (
    <div className="container-max space-y-6 py-12">
      <Link href="/admin/gallery" className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
        <ArrowLeft className="h-4 w-4" />
        All albums
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Album details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSave}>
            <div className="space-y-2">
              <Label htmlFor="album-title">Title</Label>
              <Input id="album-title" value={form.title} onChange={set('title')} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album-event">Event (optional)</Label>
              <select
                id="album-event"
                value={form.eventId}
                onChange={set('eventId')}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">No event</option>
                {(events || []).map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-description">Description (optional)</Label>
              <Textarea id="album-description" rows={3} value={form.description} onChange={set('description')} maxLength={5000} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-link">Outside folder link (optional, https)</Label>
              <Input id="album-link" type="url" value={form.externalUrl} onChange={set('externalUrl')} maxLength={500} />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((current) => (current ? { ...current, isPublished: event.target.checked } : current))}
              />
              Published (anyone with the link can see it)
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                Save
              </Button>
              {album.is_published && (
                <Button asChild variant="outline">
                  <Link href={`/gallery/${album.id}`}>View public page</Link>
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)}>
                Delete album
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photos ({album.photo_count})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              uploadFiles(Array.from(event.dataTransfer.files));
            }}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center text-sm ${
              dragging ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30' : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            <Upload className="h-6 w-6 text-ui-subtle" />
            <p>{progress ? `Uploading ${progress.done} of ${progress.total}...` : 'Drop photos here, or choose them (JPEG, PNG, WebP or HEIC, up to 10 MB each).'}</p>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/heic,.heic"
              className="hidden"
              onChange={(event) => {
                uploadFiles(Array.from(event.target.files || []));
                event.target.value = '';
              }}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={Boolean(progress)} onClick={() => fileInput.current?.click()}>
                Choose photos
              </Button>
              {retryFiles.length > 0 && !progress && (
                <Button type="button" onClick={() => uploadFiles(retryFiles)}>
                  Retry {retryFiles.length} failed
                </Button>
              )}
            </div>
          </div>

          {album.photos.length === 0 ? (
            <p className="text-sm text-ui-subtle">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {album.photos.map((photo) => {
                const isCover = album.cover_photo_id ? album.cover_photo_id === photo.id : album.photos[0]?.id === photo.id;
                return (
                  <div key={photo.id} className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={isCover ? 'default' : 'outline'}
                        disabled={isCover || setCover.isPending}
                        onClick={() => setCover.mutate(photo.id)}
                        aria-label="Set as cover"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => setPendingPhoto(photo)} aria-label="Delete photo">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {confirmDelete && (
        <ConfirmDialog
          title={`Delete "${album.title}"?`}
          description="All of its photos are deleted too. This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => {
            setConfirmDelete(false);
            removeAlbum.mutate(album.id, { onSuccess: () => router.push('/admin/gallery') });
          }}
        />
      )}

      {pendingPhoto && (
        <ConfirmDialog
          title="Delete this photo?"
          description="This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setPendingPhoto(null)}
          onConfirm={() => {
            removePhoto.mutate(pendingPhoto.id);
            setPendingPhoto(null);
          }}
        />
      )}
    </div>
  );
}
