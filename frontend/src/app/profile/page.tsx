'use client';

import React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { useProfile, useUpdateProfile, useUploadProfilePhoto } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { resolveAssetUrl } from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

type ProfileFormData = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export default function ProfilePage() {
  const { data: profile, isLoading } = useProfile();
  const update = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const { setUser } = useAuthStore();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const { register, handleSubmit, reset } = useForm<ProfileFormData>();

  React.useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.first_name || profile.firstName,
        lastName: profile.last_name || profile.lastName,
        phone: profile.phone,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (vals: ProfileFormData) => {
    const response = await update.mutateAsync(vals);
    if (response?.data) {
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
  };

  const onUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const response = await uploadPhoto.mutateAsync(file);
    if (response?.data) {
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
  };

  const imageUrl = resolveAssetUrl(profile?.profile_image_url || profile?.profileImageUrl || null);
  const displayName = `${profile?.first_name || profile?.firstName || ''} ${profile?.last_name || profile?.lastName || ''}`.trim();

  return (
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              <div className="h-11 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-11 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-11 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          )}

          {!isLoading && (
            <div className="space-y-8">
              <section className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={displayName || 'Profile photo'}
                    width={96}
                    height={96}
                    unoptimized
                    className="h-24 w-24 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                  />
                ) : (
                  <div className="inline-flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-2xl font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {(profile?.first_name || profile?.firstName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm text-ui-subtle">Upload a profile picture (JPG, PNG, WebP, max 5MB)</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onUploadPhoto}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPhoto.isPending}
                  >
                    {uploadPhoto.isPending ? 'Uploading...' : 'Upload Photo'}
                  </Button>
                </div>
              </section>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="profile-first-name">First Name</Label>
                  <Input id="profile-first-name" autoComplete="given-name" {...register('firstName')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-last-name">Last Name</Label>
                  <Input id="profile-last-name" autoComplete="family-name" {...register('lastName')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-phone">Phone</Label>
                  <Input id="profile-phone" autoComplete="tel" {...register('phone')} />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <Button type="submit" disabled={update.isPending}>
                    {update.isPending ? 'Saving...' : 'Save'}
                  </Button>

                  {update.isError && (
                    <p className="text-sm text-red-700 dark:text-red-300">Could not update profile.</p>
                  )}
                  {update.isSuccess && (
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">Profile updated.</p>
                  )}
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
