'use client';

import React, { useEffect, useState } from 'react';
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

type SettingsForm = {
  siteTitle: string;
  contactEmail: string;
  paymentPublicKey: string;
  donationSuccessMessage: string;
};

export default function AdminSettingsPage() {
  const { register, handleSubmit, reset } = useForm<SettingsForm>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      try {
        const res = await apiClient.get('/admin/settings');
        reset(res.data?.data || {});
      } catch {
        toast.error('Failed to load settings');
        setLoadFailed(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [reset, attempt]);

  const onSubmit = async (values: SettingsForm) => {
    setIsSaving(true);
    try {
      const res = await apiClient.put('/admin/settings', values);
      reset(res.data?.data || values);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Settings' }]}
        title="Settings"
        description="Site details and giving options."
      />

      {isLoading ? (
        <CardListSkeleton count={1} label="Loading settings" />
      ) : loadFailed ? (
        <LoadError what="settings" onRetry={() => setAttempt((value) => value + 1)} />
      ) : (
        <FormSection title="Site settings">
          <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
            <Field label="Site title" htmlFor="settings-site-title">
              <Input id="settings-site-title" {...register('siteTitle')} />
            </Field>
            <Field label="Contact email" htmlFor="settings-contact-email">
              <Input id="settings-contact-email" type="email" {...register('contactEmail')} />
            </Field>
            <Field
              label="Payment public key"
              htmlFor="settings-payment-key"
              hint="The public key only. Never paste a secret key here."
              full
            >
              <Input id="settings-payment-key" {...register('paymentPublicKey')} />
            </Field>
            <Field label="Donation success message" htmlFor="settings-donation-message" full>
              <Textarea id="settings-donation-message" rows={3} {...register('donationSuccessMessage')} />
            </Field>
            <FormActions>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save settings'}
              </Button>
            </FormActions>
          </form>
        </FormSection>
      )}
    </div>
  );
}
