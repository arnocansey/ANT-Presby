'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useSubmitPrayer } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type PrayerForm = {
  title: string;
  description: string;
  category: 'personal' | 'family' | 'health' | 'work' | 'financial' | 'other';
  isAnonymous: boolean;
};

export default function NewPrayerPage() {
  const { register, handleSubmit, reset } = useForm<PrayerForm>({
    defaultValues: {
      category: 'personal',
      isAnonymous: false,
    },
  });
  const submit = useSubmitPrayer();

  const onSubmit = (data: PrayerForm) => {
    submit.mutate(data, {
      onSuccess: () => {
        toast.success('Prayer submitted');
        reset({ title: '', description: '', category: 'personal', isAnonymous: false });
      },
    });
  };

  return (
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight sm:text-3xl">Submit a Prayer Request</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="prayer-title">Title</Label>
              <Input id="prayer-title" {...register('title')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prayer-description">Description</Label>
              <Textarea id="prayer-description" rows={6} {...register('description')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prayer-category">Category</Label>
              <select
                id="prayer-category"
                {...register('category')}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="personal">Personal</option>
                <option value="family">Family</option>
                <option value="health">Health</option>
                <option value="work">Work</option>
                <option value="financial">Financial</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="prayer-anonymous"
                type="checkbox"
                {...register('isAnonymous')}
                className="h-4 w-4 rounded border-slate-400 text-sky-700 focus-visible:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900"
              />
              <Label htmlFor="prayer-anonymous" className="text-sm">
                Submit anonymously
              </Label>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button type="submit" disabled={submit.isPending}>
                {submit.isPending ? 'Submitting...' : 'Submit'}
              </Button>
              {submit.isError && (
                <p className="text-sm text-red-700 dark:text-red-300">Could not submit prayer request.</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
