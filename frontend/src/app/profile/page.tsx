'use client';

import React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile, useUpdateProfile, useUploadProfilePhoto } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { resolveAssetUrl } from '@/lib/utils';

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
    <div className="container-max py-10">
      <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-10 text-white shadow-xl sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-300">Profile</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight">{displayName || 'Your Profile'}</h1>
        <p className="mt-3 text-slate-200">
          Keep your member identity up to date and make sure your account details stay current across the platform.
        </p>
      </section>

      <div className="mt-8 rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        {isLoading && <ProfileState text="Loading profile..." />}

        {!isLoading && (
          <div className="space-y-8">
            <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={displayName || 'Profile photo'}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-28 w-28 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="inline-flex h-28 w-28 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-3xl font-black text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                  {(profile?.first_name || profile?.firstName || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-ui-subtle">Upload a profile picture (JPG, PNG, WebP, max 5MB).</p>
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
                  className="rounded-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {uploadPhoto.isPending ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </div>
            </section>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-950 dark:text-white">First Name</label>
                <Input className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" {...register('firstName')} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-950 dark:text-white">Last Name</label>
                <Input className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" {...register('lastName')} />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="text-sm font-semibold text-slate-950 dark:text-white">Phone</label>
                <Input className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900" {...register('phone')} />
              </div>

              <div className="flex flex-col gap-3 lg:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  disabled={update.isPending}
                  className="h-12 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400"
                >
                  {update.isPending ? 'Saving...' : 'Save Profile'}
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
      </div>
    </div>
  );
}

function ProfileState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-10 text-center text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      <User className="mx-auto mb-4 h-10 w-10 opacity-30" />
      <p>{text}</p>
    </div>
  );
}
