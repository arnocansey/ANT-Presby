'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegister } from '@/hooks/useApi';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    acceptedTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.acceptedTerms === true, {
    message: 'You must accept the terms and agreement',
    path: ['acceptedTerms'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const registerMutation = useRegister();
  const [showPassword, setShowPassword] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);
  const registerErrorMessage =
    (registerMutation.error as any)?.response?.data?.message ||
    (registerMutation.error as any)?.response?.data?.error ||
    (registerMutation.error as any)?.response?.data?.details?.[0]?.message ||
    (registerMutation.error as Error | null)?.message ||
    'Could not create account. Please check your details and try again.';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await registerMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        acceptedTerms: data.acceptedTerms,
      });
      setRegisteredEmail(response?.data?.email || data.email);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
            <User className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Join ANT PRESS
          </h1>
          <p className="mt-2 text-sm text-ui-subtle">Create your account and stay connected</p>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          {registeredEmail ? (
            <div className="space-y-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                <Mail className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                  Check your email
                </h2>
                <p className="text-sm leading-6 text-ui-muted">
                  We sent a verification link to{' '}
                  <span className="font-semibold text-slate-950 dark:text-white">{registeredEmail}</span>.
                  Open that message and click the link before signing in.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-600"
                >
                  Go to Sign In
                </Link>
                <button
                  type="button"
                  onClick={() => setRegisteredEmail(null)}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  Register another account
                </button>
              </div>
            </div>
          ) : (
            <>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
                <Input
                  placeholder="First name"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 dark:border-slate-800 dark:bg-slate-900"
                  {...register('firstName')}
                />
                {errors.firstName && <p className="mt-2 text-sm text-red-600">{errors.firstName.message}</p>}
              </div>

              <div className="relative">
                <Input
                  placeholder="Last name"
                  className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                  {...register('lastName')}
                />
                {errors.lastName && <p className="mt-2 text-sm text-red-600">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
              <Input
                type="email"
                placeholder="Email address"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 dark:border-slate-800 dark:bg-slate-900"
                {...register('email')}
              />
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
              <Input
                type="tel"
                placeholder="Phone number"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 dark:border-slate-800 dark:bg-slate-900"
                {...register('phone')}
              />
              {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create password"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 pr-10 dark:border-slate-800 dark:bg-slate-900"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ui-subtle hover:text-slate-950 dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            <div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ui-muted dark:border-slate-800 dark:bg-slate-900">
              <input
                type="checkbox"
                {...register('acceptedTerms')}
                className="mt-1 h-4 w-4 rounded border-slate-400 text-sky-700"
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" className="font-semibold text-sky-700 hover:underline dark:text-cyan-300">
                  Terms and Agreement
                </Link>
                .
              </span>
            </label>
            {errors.acceptedTerms && (
              <p className="text-sm text-red-600">{errors.acceptedTerms.message}</p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>

            {registerMutation.isError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {registerErrorMessage}
              </p>
            )}
          </form>

          <p className="mt-5 text-center text-sm text-ui-subtle">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-sky-700 hover:underline dark:text-cyan-300">
              Sign in
            </Link>
          </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
