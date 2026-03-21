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
    <div className="container-max py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">New Ministry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="ministry-name">Name</Label>
              <Input id="ministry-name" {...register('name', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ministry-leader-name">Leader Name</Label>
              <Input id="ministry-leader-name" {...register('leaderName')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ministry-description">Description</Label>
              <Textarea id="ministry-description" rows={5} {...register('description')} />
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit">Create Ministry</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
