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

type MinistryForm = {
  name: string;
  description: string;
  leaderName: string;
};

export default function NewMinistryPage() {
  const { register, handleSubmit } = useForm<MinistryForm>();
  const router = useRouter();

  const onSubmit = async (data: MinistryForm) => {
    try {
      await apiClient.post('/ministries', data);
      toast.success('Ministry created');
      router.push('/admin/ministries');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create ministry');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Ministries', href: '/admin/ministries' }, { label: 'New ministry' }]}
        title="New ministry"
      />

      <FormSection title="Ministry details">
        <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
          <Field label="Name" htmlFor="ministry-name">
            <Input id="ministry-name" {...register('name', { required: true })} />
          </Field>
          <Field label="Leader name" htmlFor="ministry-leader-name">
            <Input id="ministry-leader-name" {...register('leaderName')} />
          </Field>
          <Field label="Description" htmlFor="ministry-description" full>
            <Textarea id="ministry-description" rows={5} {...register('description')} />
          </Field>
          <FormActions>
            <Button type="submit">Create ministry</Button>
            <Button asChild variant="secondary">
              <Link href="/admin/ministries">Cancel</Link>
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
