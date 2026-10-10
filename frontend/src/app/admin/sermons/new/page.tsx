'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { useRefreshSermonData, useSermonSeriesList } from '@/hooks/useApi';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

type SermonForm = {
  title: string;
  speaker: string;
  videoUrl: string;
  description: string;
  sermonDate: string;
  ministryId: number;
  seriesId: string;
};

export default function NewSermonPage() {
  const { register, handleSubmit } = useForm<SermonForm>({
    defaultValues: {
      sermonDate: new Date().toISOString().slice(0, 16),
      seriesId: '',
    },
  });
  const router = useRouter();
  const { data: seriesList } = useSermonSeriesList();
  const refreshSermonData = useRefreshSermonData();

  const onSubmit = async (data: SermonForm) => {
    try {
      await apiClient.post('/admin/sermons', {
        ...data,
        seriesId: data.seriesId ? Number(data.seriesId) : null,
      });
      refreshSermonData();
      toast.success('Sermon created');
      router.push('/admin/sermons');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create sermon');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Sermons', href: '/admin/sermons' }, { label: 'New sermon' }]}
        title="New sermon"
        description="Add a sermon to the library."
      />

      <FormSection title="Sermon details">
        <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
          <Field label="Title" htmlFor="sermon-title" full>
            <Input id="sermon-title" {...register('title')} />
          </Field>
          <Field label="Speaker" htmlFor="sermon-speaker">
            <Input id="sermon-speaker" {...register('speaker')} />
          </Field>
          <Field label="Sermon date" htmlFor="sermon-date">
            <Input id="sermon-date" type="datetime-local" {...register('sermonDate')} />
          </Field>
          <Field label="Video URL (embed)" htmlFor="sermon-video-url" full>
            <Input id="sermon-video-url" {...register('videoUrl')} />
          </Field>
          <Field label="Ministry ID" htmlFor="sermon-ministry-id">
            <Input id="sermon-ministry-id" type="number" min="1" {...register('ministryId', { valueAsNumber: true })} />
          </Field>
          <Field label="Series" htmlFor="sermon-series">
            <Select id="sermon-series" {...register('seriesId')}>
              <option value="">No series</option>
              {(seriesList ?? []).map((series) => (
                <option key={series.id} value={String(series.id)}>
                  {series.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" htmlFor="sermon-description" full>
            <Textarea id="sermon-description" rows={6} {...register('description')} />
          </Field>
          <FormActions>
            <Button type="submit">Create sermon</Button>
            <Button asChild variant="secondary">
              <Link href="/admin/sermons">Cancel</Link>
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
