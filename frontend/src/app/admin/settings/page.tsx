'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type SettingsForm = {
  siteTitle: string;
  contactEmail: string;
  paymentPublicKey: string;
  donationSuccessMessage: string;
};

export default function AdminSettingsPage() {
  const { register, handleSubmit, reset } = useForm<SettingsForm>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/admin/settings');
        reset(res.data?.data || {});
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [reset]);

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
    <div className="container-max py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Site Settings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-ui-subtle">Loading settings...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="settings-site-title">Site Title</Label>
                <Input id="settings-site-title" {...register('siteTitle')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-contact-email">Contact Email</Label>
                <Input id="settings-contact-email" type="email" {...register('contactEmail')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-payment-key">Payment Public Key</Label>
                <Input id="settings-payment-key" {...register('paymentPublicKey')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-donation-message">Donation Success Message</Label>
                <Textarea id="settings-donation-message" rows={3} {...register('donationSuccessMessage')} />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
