'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { useRefreshSermonData, useSermonSeriesList } from '@/hooks/useApi';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

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
  const refreshSermonData = useRefreshSermonData();
  const [loadState, setLoadState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!id) return;
    setLoadState('loading');
    apiClient
      .get(`/admin/sermons/${id}`)
      .then((res) => {
        reset({
          ...res.data.data,
          videoUrl: res.data.data?.video_url || '',
          sermonDate: res.data.data?.sermon_date
            ? new Date(res.data.data.sermon_date).toISOString().slice(0, 16)
            : '',
          ministryId: res.data.data?.ministry_id,
          seriesId: res.data.data?.series_id ? String(res.data.data.series_id) : '',
        });
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [id, reset, attempt]);

  const onSubmit = async (vals: SermonForm) => {
    try {
      await apiClient.put(`/admin/sermons/${id}`, {
        ...vals,
        seriesId: vals.seriesId ? Number(vals.seriesId) : null,
      });
      refreshSermonData();
      toast.success('Sermon updated');
      router.push('/admin/sermons');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Sermons', href: '/admin/sermons' }, { label: 'Edit sermon' }]}
        title="Edit sermon"
      />

      {loadState === 'loading' ? (
        <CardListSkeleton count={1} label="Loading sermon" />
      ) : loadState === 'error' ? (
        <LoadError what="this sermon" onRetry={() => setAttempt((value) => value + 1)} />
      ) : (
        <FormSection title="Sermon details">
          <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
            <Field label="Title" htmlFor="edit-sermon-title" full>
              <Input id="edit-sermon-title" {...register('title')} />
            </Field>
            <Field label="Speaker" htmlFor="edit-sermon-speaker">
              <Input id="edit-sermon-speaker" {...register('speaker')} />
            </Field>
            <Field label="Sermon date" htmlFor="edit-sermon-date">
              <Input id="edit-sermon-date" type="datetime-local" {...register('sermonDate')} />
            </Field>
            <Field label="Video URL" htmlFor="edit-sermon-video-url" full>
              <Input id="edit-sermon-video-url" {...register('videoUrl')} />
            </Field>
            <Field label="Ministry ID" htmlFor="edit-sermon-ministry-id">
              <Input
                id="edit-sermon-ministry-id"
                type="number"
                min="1"
                {...register('ministryId', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Series" htmlFor="edit-sermon-series">
              {/* Mount the select only once its options exist, so the sermon's saved series
                  is selected even when the series list loads after the sermon. */}
              {seriesList ? (
                <Select id="edit-sermon-series" {...register('seriesId')}>
                  <option value="">No series</option>
                  {seriesList.map((series) => (
                    <option key={series.id} value={String(series.id)}>
                      {series.title}
                    </option>
                  ))}
                </Select>
              ) : (
                <Skeleton className="h-11 w-full" />
              )}
            </Field>
            <Field label="Description" htmlFor="edit-sermon-description" full>
              <Textarea id="edit-sermon-description" rows={6} {...register('description')} />
            </Field>
            <FormActions>
              <Button type="submit">Save</Button>
              <Button asChild variant="secondary">
                <Link href="/admin/sermons">Cancel</Link>
              </Button>
            </FormActions>
          </form>
        </FormSection>
      )}
    </div>
  );
}
