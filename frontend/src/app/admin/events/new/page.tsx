'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
      await apiClient.post('/admin/events', data);
      toast.success('Event created');
      router.push('/admin/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  return (
    <div className="container-max py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="event-name">Name</Label>
              <Input id="event-name" {...register('name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-description">Description</Label>
              <Textarea id="event-description" rows={4} {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">Event Date</Label>
              <Input id="event-date" type="datetime-local" {...register('eventDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-location">Location</Label>
              <Input id="event-location" {...register('location')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-max-registrations">Max Registrations</Label>
              <Input
                id="event-max-registrations"
                type="number"
                min="1"
                {...register('maxRegistrations', {
                  setValueAs: (value) => (value === '' ? undefined : Number(value)),
                })}
              />
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit">Create Event</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
