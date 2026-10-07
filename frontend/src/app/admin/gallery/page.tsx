'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAdminAlbums, useAdminEvents, useSaveAlbum } from '@/hooks/useApi';

type FormState = { title: string; description: string; eventId: string; externalUrl: string };
const EMPTY: FormState = { title: '', description: '', eventId: '', externalUrl: '' };

export default function AdminGalleryPage() {
  const router = useRouter();
  const { data: albums, isLoading } = useAdminAlbums();
  const { data: events } = useAdminEvents();
  const save = useSaveAlbum();
  const [form, setForm] = React.useState<FormState>(EMPTY);

  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate(
      {
        input: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventId: form.eventId ? Number(form.eventId) : null,
          externalUrl: form.externalUrl.trim() || null,
          isPublished: false,
        },
      },
      {
        onSuccess: ({ album }) => {
          setForm(EMPTY);
          if (album?.id) router.push(`/admin/gallery/${album.id}`);
        },
      }
    );
  };

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Photo Gallery</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Create an album as a draft, add photos, then publish it. Everyone is notified once, when a published album first has photos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New album</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreate}>
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
              <Input
                id="album-link"
                type="url"
                value={form.externalUrl}
                onChange={set('externalUrl')}
                maxLength={500}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                Create draft album
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading albums...</p>
      ) : !albums || albums.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No albums yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {albums.map((album) => (
            <Card key={album.id}>
              <CardContent className="flex items-center gap-4 p-4">
                {album.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.cover_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-800" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{album.title}</p>
                  <p className="text-xs text-ui-subtle">
                    {album.is_published ? 'Published' : 'Draft'} · {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                    {album.event_name ? ` · ${album.event_name}` : ''}
                    {album.notified_at ? ' · everyone notified' : ''}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/gallery/${album.id}`}>Manage</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
