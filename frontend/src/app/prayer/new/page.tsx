'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import StatusMessage from '@/components/site/StatusMessage';
import { useSubmitPrayer } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type PrayerForm = {
  title: string;
  description: string;
  category: 'personal' | 'family' | 'health' | 'work' | 'financial' | 'other';
  isAnonymous: boolean;
  shareOnWall: boolean;
};

const checkboxClass =
  'mt-0.5 h-5 w-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default function NewPrayerPage() {
  const { register, handleSubmit, reset } = useForm<PrayerForm>({
    defaultValues: {
      category: 'personal',
      isAnonymous: false,
      shareOnWall: false,
    },
  });
  const submit = useSubmitPrayer();

  const onSubmit = (data: PrayerForm) => {
    submit.mutate(data, {
      onSuccess: () => {
        toast.success('Prayer submitted');
        reset({ title: '', description: '', category: 'personal', isAnonymous: false, shareOnWall: false });
      },
    });
  };

  return (
    <div className="container-max py-10 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <PageHeader
          eyebrow="Prayer"
          title="Submit a prayer request"
          description="Share what is on your heart. The church will pray with you."
          actions={
            <Button asChild variant="secondary">
              <Link href="/prayer/wall">Prayer wall</Link>
            </Button>
          }
        />

        <Card>
          <CardContent className="p-6 sm:p-8">
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
                <Select id="prayer-category" {...register('category')}>
                  <option value="personal">Personal</option>
                  <option value="family">Family</option>
                  <option value="health">Health</option>
                  <option value="work">Work</option>
                  <option value="financial">Financial</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div className="flex items-start gap-3">
                <input id="prayer-anonymous" type="checkbox" {...register('isAnonymous')} className={checkboxClass} />
                <Label htmlFor="prayer-anonymous" className="font-normal leading-snug">
                  Submit anonymously
                </Label>
              </div>

              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <input id="prayer-share-on-wall" type="checkbox" {...register('shareOnWall')} className={checkboxClass} />
                  <Label htmlFor="prayer-share-on-wall" className="font-normal leading-snug">
                    Share on the prayer wall
                  </Label>
                </div>
                <p className="pl-8 text-xs text-muted">
                  After approval, other signed-in members can see this request and pray for you.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" loading={submit.isPending}>
                  {submit.isPending ? 'Submitting...' : 'Submit'}
                </Button>
                {submit.isError && <StatusMessage tone="danger">Could not submit prayer request.</StatusMessage>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
