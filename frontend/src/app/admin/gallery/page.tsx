'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageIcon } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAdminAlbums, useAdminEvents, useSaveAlbum } from '@/hooks/useApi';

type FormState = { title: string; description: string; eventId: string; externalUrl: string };
const EMPTY: FormState = { title: '', description: '', eventId: '', externalUrl: '' };

export default function AdminGalleryPage() {
  const router = useRouter();
  const { data: albums, isLoading, isError, refetch } = useAdminAlbums();
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
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Gallery' }]}
        title="Photo gallery"
        description="Create an album as a draft, add photos, then publish it. Everyone is notified once, when a published album first has photos."
      />

      <FormSection title="New album">
        <form className={formGridClass} onSubmit={onCreate}>
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
            <Input
              id="album-link"
              type="url"
              value={form.externalUrl}
              onChange={set('externalUrl')}
              maxLength={500}
              placeholder="https://drive.google.com/..."
            />
          </Field>
          <FormActions>
            <Button type="submit" disabled={save.isPending}>
              Create draft album
            </Button>
          </FormActions>
        </form>
      </FormSection>

      <section aria-label="Albums" className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Albums</h2>
        {isLoading ? (
          <CardListSkeleton count={3} label="Loading albums" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />
        ) : isError && !albums ? (
          <LoadError what="albums" onRetry={() => refetch()} />
        ) : !albums || albums.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No albums yet." message="Create a draft album above, then add photos." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <li key={album.id}>
                <Card className="flex h-full flex-col overflow-hidden">
                  {album.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover_url} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-surface text-muted">
                      <ImageIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0 space-y-2">
                      <p className="truncate font-semibold text-foreground">{album.title}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={album.is_published ? 'success' : 'neutral'}>
                          {album.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {album.notified_at && <Badge tone="neutral">Everyone notified</Badge>}
                      </div>
                      <p className="text-xs text-muted">
                        {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                        {album.event_name ? ` · ${album.event_name}` : ''}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="secondary" className="mt-auto self-start">
                      <Link href={`/admin/gallery/${album.id}`} aria-label={`Manage ${album.title}`}>
                        Manage
                      </Link>
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
