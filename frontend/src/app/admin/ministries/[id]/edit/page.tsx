'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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

export default function EditMinistryPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<MinistryForm>();

  React.useEffect(() => {
    if (!id) return;

    apiClient.get(`/ministries/${id}`).then((res) =>
      reset({
        name: res.data.data?.name || '',
        description: res.data.data?.description || '',
        leaderName: res.data.data?.leader_name || res.data.data?.leaderName || '',
      })
    );
  }, [id, reset]);

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
    <div className="container-max py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Edit Ministry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-ministry-name">Name</Label>
              <Input id="edit-ministry-name" {...register('name', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ministry-leader-name">Leader Name</Label>
              <Input id="edit-ministry-leader-name" {...register('leaderName')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ministry-description">Description</Label>
              <Textarea id="edit-ministry-description" rows={5} {...register('description')} />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Save Ministry</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
