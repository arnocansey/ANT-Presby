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

type SermonForm = {
  title: string;
  speaker: string;
  videoUrl: string;
  description: string;
  sermonDate: string;
  ministryId: number;
};

export default function NewSermonPage() {
  const { register, handleSubmit } = useForm<SermonForm>({
    defaultValues: {
      sermonDate: new Date().toISOString().slice(0, 16),
    },
  });
  const router = useRouter();

  const onSubmit = async (data: SermonForm) => {
    try {
      await apiClient.post('/admin/sermons', data);
      toast.success('Sermon created');
      router.push('/admin/sermons');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create sermon');
    }
  };

  return (
    <div className="container-max py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">New Sermon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sermon-title">Title</Label>
              <Input id="sermon-title" {...register('title')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sermon-speaker">Speaker</Label>
              <Input id="sermon-speaker" {...register('speaker')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sermon-video-url">Video URL (embed)</Label>
              <Input id="sermon-video-url" {...register('videoUrl')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sermon-date">Sermon Date</Label>
              <Input id="sermon-date" type="datetime-local" {...register('sermonDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sermon-ministry-id">Ministry ID</Label>
              <Input
                id="sermon-ministry-id"
                type="number"
                min="1"
                {...register('ministryId', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sermon-description">Description</Label>
              <Textarea id="sermon-description" rows={6} {...register('description')} />
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit">Create Sermon</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
