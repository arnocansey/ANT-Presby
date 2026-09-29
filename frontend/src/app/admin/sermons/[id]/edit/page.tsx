'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { useSermonSeriesList } from '@/hooks/useApi';
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
  ministryId?: number;
  seriesId?: string;
};

export default function EditSermonPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { register, handleSubmit, reset } = useForm<SermonForm>();
  const router = useRouter();
  const { data: seriesList } = useSermonSeriesList();

  React.useEffect(() => {
    if (!id) return;
    apiClient.get(`/admin/sermons/${id}`).then((res) =>
      reset({
        ...res.data.data,
        videoUrl: res.data.data?.video_url || '',
        sermonDate: res.data.data?.sermon_date
          ? new Date(res.data.data.sermon_date).toISOString().slice(0, 16)
          : '',
        ministryId: res.data.data?.ministry_id,
        seriesId: res.data.data?.series_id ? String(res.data.data.series_id) : '',
      })
    );
  }, [id, reset]);

  const onSubmit = async (vals: SermonForm) => {
    try {
      await apiClient.put(`/admin/sermons/${id}`, {
        ...vals,
        seriesId: vals.seriesId ? Number(vals.seriesId) : null,
      });
      toast.success('Sermon updated');
      router.push('/admin/sermons');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="container-max py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Edit Sermon</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-sermon-title">Title</Label>
              <Input id="edit-sermon-title" {...register('title')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sermon-speaker">Speaker</Label>
              <Input id="edit-sermon-speaker" {...register('speaker')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sermon-video-url">Video URL</Label>
              <Input id="edit-sermon-video-url" {...register('videoUrl')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sermon-date">Sermon Date</Label>
              <Input id="edit-sermon-date" type="datetime-local" {...register('sermonDate')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sermon-ministry-id">Ministry ID</Label>
              <Input
                id="edit-sermon-ministry-id"
                type="number"
                min="1"
                {...register('ministryId', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sermon-series">Series</Label>
              <select
                id="edit-sermon-series"
                {...register('seriesId')}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">No series</option>
                {(seriesList ?? []).map((series) => (
                  <option key={series.id} value={String(series.id)}>
                    {series.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sermon-description">Description</Label>
              <Textarea id="edit-sermon-description" rows={6} {...register('description')} />
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
