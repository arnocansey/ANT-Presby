'use client';

import React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Camera, UserRound } from 'lucide-react';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile, useUpdateProfile, useUploadProfilePhoto } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { resolveAssetUrl } from '@/lib/utils';

type ProfileFormData = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile();
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
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Profile"
        title={displayName || 'Your Profile'}
        description="Keep your member details up to date across the site."
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
      />

      {isLoading ? (
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8" role="status">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      ) : isError ? (
        <EmptyState icon={UserRound} title="Your profile couldn't load right now" message="Please try again in a moment." />
      ) : (
        <Card>
          <CardContent className="space-y-8 p-6 sm:p-8">
            <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={displayName || 'Profile photo'}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-28 w-28 rounded-full border border-border object-cover"
                />
              ) : (
                <div
                  className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary"
                  aria-hidden="true"
                >
                  {(profile?.first_name || profile?.firstName || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-muted">Upload a profile picture (JPG, PNG, WebP, max 5MB).</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onUploadPhoto}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadPhoto.isPending}
                >
                  {!uploadPhoto.isPending && <Camera className="h-4 w-4" aria-hidden="true" />}
                  {uploadPhoto.isPending ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </div>
            </section>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 border-t border-border pt-8 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-first-name">First name</Label>
                <Input id="profile-first-name" {...register('firstName')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-last-name">Last name</Label>
                <Input id="profile-last-name" {...register('lastName')} />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input id="profile-phone" type="tel" {...register('phone')} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-2">
                <Button type="submit" size="lg" loading={update.isPending}>
                  {update.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
                <div aria-live="polite">
                  {update.isError && <StatusMessage tone="danger">Could not update profile.</StatusMessage>}
                  {update.isSuccess && <StatusMessage tone="success">Profile updated.</StatusMessage>}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
