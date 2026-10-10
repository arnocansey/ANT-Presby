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

type MinistryForm = {
  name: string;
  description: string;
  leaderName: string;
};

export default function EditMinistryPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<MinistryForm>();
  const [loadState, setLoadState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!id) return;
    setLoadState('loading');
    apiClient
      .get(`/ministries/${id}`)
      .then((res) => {
        reset({
          name: res.data.data?.name || '',
          description: res.data.data?.description || '',
          leaderName: res.data.data?.leader_name || res.data.data?.leaderName || '',
        });
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [id, reset, attempt]);

  const onSubmit = async (vals: MinistryForm) => {
    try {
      await apiClient.put(`/ministries/${id}`, vals);
      toast.success('Ministry updated');
      router.push('/admin/ministries');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Ministries', href: '/admin/ministries' }, { label: 'Edit ministry' }]}
        title="Edit ministry"
      />

      {loadState === 'loading' ? (
        <CardListSkeleton count={1} label="Loading ministry" />
      ) : loadState === 'error' ? (
        <LoadError what="this ministry" onRetry={() => setAttempt((value) => value + 1)} />
      ) : (
        <FormSection title="Ministry details">
          <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
            <Field label="Name" htmlFor="edit-ministry-name">
              <Input id="edit-ministry-name" {...register('name', { required: true })} />
            </Field>
            <Field label="Leader name" htmlFor="edit-ministry-leader-name">
              <Input id="edit-ministry-leader-name" {...register('leaderName')} />
            </Field>
            <Field label="Description" htmlFor="edit-ministry-description" full>
              <Textarea id="edit-ministry-description" rows={5} {...register('description')} />
            </Field>
            <FormActions>
              <Button type="submit">Save ministry</Button>
              <Button asChild variant="secondary">
                <Link href="/admin/ministries">Cancel</Link>
              </Button>
            </FormActions>
          </form>
        </FormSection>
      )}
    </div>
  );
}
