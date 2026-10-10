'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

type EventForm = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations?: number;
};

export default function NewEventPage() {
  const { register, handleSubmit } = useForm<EventForm>({
    defaultValues: {
      eventDate: new Date().toISOString().slice(0, 16),
    },
  });
  const router = useRouter();

  const onSubmit = async (data: EventForm) => {
    try {
      const response = await apiClient.post('/admin/events', data);
      const createdId = response.data?.data?.id;
      toast.success(createdId ? 'Event created. You can add an image now.' : 'Event created');
      router.push(createdId ? `/admin/events/${createdId}/edit` : '/admin/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Events', href: '/admin/events' }, { label: 'New event' }]}
        title="New event"
        description="You can add an image after the event is created."
      />

      <FormSection title="Event details">
        <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
          <Field label="Name" htmlFor="event-name" full>
            <Input id="event-name" {...register('name')} />
          </Field>
          <Field label="Description" htmlFor="event-description" full>
            <Textarea id="event-description" rows={4} {...register('description')} />
          </Field>
          <Field label="Event date" htmlFor="event-date">
            <Input id="event-date" type="datetime-local" {...register('eventDate')} />
          </Field>
          <Field label="Location" htmlFor="event-location">
            <Input id="event-location" {...register('location')} />
          </Field>
          <Field label="Max registrations" htmlFor="event-max-registrations" hint="Leave blank for no limit.">
            <Input
              id="event-max-registrations"
              type="number"
              min="1"
              {...register('maxRegistrations', {
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
            />
          </Field>
          <FormActions>
            <Button type="submit">Create event</Button>
            <Button asChild variant="secondary">
              <Link href="/admin/events">Cancel</Link>
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
