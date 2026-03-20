'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRegister } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';

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
  const router = useRouter();
  const { user, isAuthenticated, hydrate, setUser, setIsAuthenticated } = useAuthStore();
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, router, user]);

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
      setUser(response.data.user);
      setIsAuthenticated(true);
      router.replace(response.data.user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Create Account</CardTitle>
          <CardDescription className="text-ui-subtle">
            Join ANT PRESS and create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="First name" {...register('firstName')} />
                {errors.firstName && (
                  <p className="text-xs text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Last name" {...register('lastName')} />
                {errors.lastName && (
                  <p className="text-xs text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Phone number"
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label htmlFor="acceptedTerms" className="inline-flex items-start gap-2 text-sm text-ui-muted">
                <input
                  id="acceptedTerms"
                  type="checkbox"
                  {...register('acceptedTerms')}
                  className="mt-0.5 h-4 w-4 rounded border-slate-400 text-sky-700 focus-visible:ring-cyan-500 dark:border-slate-600 dark:bg-slate-900"
                />
                <span>
                  I agree to the{' '}
                  <Link href="/terms" className="font-semibold text-sky-700 hover:underline dark:text-cyan-300">
                    Terms and Agreement
                  </Link>.
                </span>
              </label>
              {errors.acceptedTerms && (
                <p className="text-xs text-red-600">{errors.acceptedTerms.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>

            {registerMutation.isError && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                Could not create account. Please check your details and try again.
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-ui-subtle">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-sky-700 hover:underline dark:text-cyan-300">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
