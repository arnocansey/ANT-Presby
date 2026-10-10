'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useRemoveEventImage, useUploadEventImage } from '@/hooks/useApi';
import { resolveAssetUrl } from '@/lib/utils';

type EventForm = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations?: number;
};

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { register, handleSubmit, reset } = useForm<EventForm>();
  const router = useRouter();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const uploadImage = useUploadEventImage(id);
  const removeImage = useRemoveEventImage(id);
  const [loadState, setLoadState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!id) return;
    setLoadState('loading');
    apiClient
      .get(`/admin/events/${id}`)
      .then((res) => {
        reset({
          ...res.data.data,
          eventDate: res.data.data?.event_date
            ? new Date(res.data.data.event_date).toISOString().slice(0, 16)
            : '',
        });
        setImageUrl(res.data.data?.image_url ?? null);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [id, reset, attempt]);

  const onSubmit = async (vals: EventForm) => {
    try {
      await apiClient.put(`/admin/events/${id}`, vals);
      toast.success('Event updated');
      router.push('/admin/events');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Events', href: '/admin/events' }, { label: 'Edit event' }]}
        title="Edit event"
      />

      {loadState === 'loading' ? (
        <CardListSkeleton count={2} label="Loading event" />
      ) : loadState === 'error' ? (
        <LoadError what="this event" onRetry={() => setAttempt((value) => value + 1)} />
      ) : (
        <>
          <FormSection title="Image" description="JPEG, PNG, WebP or GIF, up to 5 MB.">
            <div className="space-y-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveAssetUrl(imageUrl)}
                  alt=""
                  className="h-48 w-full rounded-card border border-border object-cover"
                />
              )}
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="edit-event-image" className="sr-only">
                  Image
                </label>
                <Input
                  id="edit-event-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="max-w-xs"
                  disabled={uploadImage.isPending || removeImage.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Choose an image under 5 MB');
                      return;
                    }
                    uploadImage.mutate(file, { onSuccess: (data) => setImageUrl(data.image_url) });
                  }}
                />
                {imageUrl && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={uploadImage.isPending || removeImage.isPending}
                    onClick={() => removeImage.mutate(undefined, { onSuccess: () => setImageUrl(null) })}
                  >
                    Remove image
                  </Button>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection title="Event details">
            <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
              <Field label="Name" htmlFor="edit-event-name" full>
                <Input id="edit-event-name" {...register('name')} />
              </Field>
              <Field label="Description" htmlFor="edit-event-description" full>
                <Textarea id="edit-event-description" rows={4} {...register('description')} />
              </Field>
              <Field label="Event date" htmlFor="edit-event-date">
                <Input id="edit-event-date" type="datetime-local" {...register('eventDate')} />
              </Field>
              <Field label="Location" htmlFor="edit-event-location">
                <Input id="edit-event-location" {...register('location')} />
              </Field>
              <Field label="Max registrations" htmlFor="edit-event-max-registrations" hint="Leave blank for no limit.">
                <Input
                  id="edit-event-max-registrations"
                  type="number"
                  min="1"
                  {...register('maxRegistrations', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                />
              </Field>
              <FormActions>
                <Button type="submit">Save</Button>
                <Button asChild variant="secondary">
                  <Link href="/admin/events">Cancel</Link>
                </Button>
              </FormActions>
            </form>
          </FormSection>
        </>
      )}
    </div>
  );
}
