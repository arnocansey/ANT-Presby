'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ImageIcon, Star, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxField, Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
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
  // Uploaded to Cloudinary but not yet recorded: retried by id, never uploaded twice.
  const [retryIds, setRetryIds] = React.useState<string[]>([]);
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

  // Records uploaded ids, 100 per request. Refused ids are final (wrong type or too big); ids whose
  // request failed are returned so a retry can record them without uploading the files again.
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

  // Uploads straight to Cloudinary, 4 at a time, then records the uploaded ids (plus any left from a failed record).
  const uploadFiles = async (files: File[], unrecordedIds: string[] = []) => {
    if ((files.length === 0 && unrecordedIds.length === 0) || progress) return;
    const tooBig = files.filter((file) => file.size > MAX_ALBUM_PHOTO_BYTES);
    const ready = files.filter((file) => file.size <= MAX_ALBUM_PHOTO_BYTES);
    if (tooBig.length > 0) toast.error(`${tooBig.length} photo(s) are over 10 MB and were skipped`);
    if (ready.length === 0 && unrecordedIds.length === 0) return;

    setRetryFiles([]);
    setRetryIds([]);
    setProgress({ done: 0, total: ready.length });
    try {
      const uploadedIds = [...unrecordedIds];
      const failedUploads: File[] = [];
      if (ready.length > 0) {
        const signature = await getSignature.mutateAsync();
        const results = await mapWithConcurrency(ready, 4, async (file) => {
          try {
            return await uploadToCloudinary(file, signature);
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
      setRetryFiles(failedUploads);
      setRetryIds(unrecorded);

      const total = ready.length + unrecordedIds.length;
      const retryable = failedUploads.length + unrecorded.length;
      const message = `${added} of ${total} added${refused > 0 ? `. ${refused} not accepted (wrong type or over 10 MB)` : ''}`;
      if (retryable > 0) toast.error(`${message}. You can retry ${retryable} photo(s).`);
      else if (refused > 0) toast.error(message);
      else toast.success(message);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not start the upload');
    } finally {
      setProgress(null);
    }
  };

  const crumbs = [ADMIN_HOME_CRUMB, { label: 'Gallery', href: '/admin/gallery' }];

  if (isLoading || (album && !form)) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Album' }]} title="Album" />
        <CardListSkeleton count={2} label="Loading album" />
      </div>
    );
  }
  if (!album || !form || !id) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Album' }]} title="Album" />
        <EmptyState
          icon={ImageIcon}
          title="Album not found."
          message="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/gallery">All albums</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[...crumbs, { label: album.title }]}
        title={album.title}
        description="Edit the details, add photos and choose the cover."
        actions={
          <Badge tone={album.is_published ? 'success' : 'neutral'}>{album.is_published ? 'Published' : 'Draft'}</Badge>
        }
      />

      <FormSection title="Album details">
        <form className={formGridClass} onSubmit={onSave}>
          <Field label="Title" htmlFor="album-title">
            <Input id="album-title" value={form.title} onChange={set('title')} required maxLength={255} />
          </Field>
          <Field label="Event (optional)" htmlFor="album-event">
            <Select id="album-event" value={form.eventId} onChange={set('eventId')}>
              <option value="">No event</option>
              {(events || []).map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description (optional)" htmlFor="album-description" full>
            <Textarea id="album-description" rows={3} value={form.description} onChange={set('description')} maxLength={5000} />
          </Field>
          <Field label="Outside folder link (optional, https)" htmlFor="album-link" full>
            <Input id="album-link" type="url" value={form.externalUrl} onChange={set('externalUrl')} maxLength={500} />
          </Field>
          <CheckboxField
            label="Published (anyone with the link can see it)"
            checked={form.isPublished}
            onChange={(event) => setForm((current) => (current ? { ...current, isPublished: event.target.checked } : current))}
          />
          <FormActions>
            <Button type="submit" disabled={save.isPending}>
              Save
            </Button>
            {album.is_published && (
              <Button asChild variant="secondary">
                <Link href={`/gallery/${album.id}`}>View public page</Link>
              </Button>
            )}
            <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete album
            </Button>
          </FormActions>
        </form>
      </FormSection>

      <FormSection title={`Photos (${album.photo_count})`}>
        <div className="space-y-4">
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
            className={`flex flex-col items-center gap-3 rounded-card border-2 border-dashed p-8 text-center text-sm text-foreground ${
              dragging ? 'border-primary bg-primary/10' : 'border-input bg-surface/50'
            }`}
          >
            <Upload className="h-6 w-6 text-muted" aria-hidden="true" />
            <p aria-live="polite">{progress ? `Uploading ${progress.done} of ${progress.total}...` : 'Drop photos here, or choose them (JPEG, PNG, WebP or HEIC, up to 10 MB each).'}</p>
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
            <div className="flex flex-wrap justify-center gap-2">
              <Button type="button" variant="secondary" disabled={Boolean(progress)} onClick={() => fileInput.current?.click()}>
                Choose photos
              </Button>
              {retryFiles.length + retryIds.length > 0 && !progress && (
                <Button type="button" onClick={() => uploadFiles(retryFiles, retryIds)}>
                  Retry {retryFiles.length + retryIds.length} failed
                </Button>
              )}
            </div>
          </div>

          {album.photos.length === 0 ? (
            <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
              No photos yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {album.photos.map((photo) => {
                const isCover = album.cover_photo_id ? album.cover_photo_id === photo.id : album.photos[0]?.id === photo.id;
                return (
                  <div key={photo.id} className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full rounded-lg border border-border object-cover" />
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={isCover ? 'primary' : 'secondary'}
                        disabled={isCover || setCover.isPending}
                        onClick={() => setCover.mutate(photo.id)}
                        aria-label="Set as cover"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setPendingPhoto(photo)} aria-label="Delete photo">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </FormSection>

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
