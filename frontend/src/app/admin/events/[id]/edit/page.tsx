'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

  React.useEffect(() => {
    if (!id) return;
    apiClient.get(`/admin/events/${id}`).then((res) => {
      reset({
        ...res.data.data,
        eventDate: res.data.data?.event_date
          ? new Date(res.data.data.event_date).toISOString().slice(0, 16)
          : '',
      });
      setImageUrl(res.data.data?.image_url ?? null);
    });
  }, [id, reset]);

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
    <div className="container-max py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Edit Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 space-y-2">
            <Label htmlFor="edit-event-image">Image</Label>
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveAssetUrl(imageUrl)} alt="" className="h-48 w-full rounded-xl object-cover" />
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Input
                id="edit-event-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="max-w-xs"
                disabled={uploadImage.isPending}
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
                  variant="outline"
                  disabled={removeImage.isPending}
                  onClick={() => removeImage.mutate(undefined, { onSuccess: () => setImageUrl(null) })}
                >
                  Remove image
                </Button>
              )}
            </div>
            <p className="text-xs text-ui-subtle">JPEG, PNG, WebP or GIF, up to 5 MB.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-event-name">Name</Label>
              <Input id="edit-event-name" {...register('name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-event-description">Description</Label>
              <Textarea id="edit-event-description" rows={4} {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-event-date">Event Date</Label>
              <Input id="edit-event-date" type="datetime-local" {...register('eventDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-event-location">Location</Label>
              <Input id="edit-event-location" {...register('location')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-event-max-registrations">Max Registrations</Label>
              <Input
                id="edit-event-max-registrations"
                type="number"
                min="1"
                {...register('maxRegistrations', {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })}
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Save</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
