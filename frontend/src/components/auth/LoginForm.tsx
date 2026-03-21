'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { user, isAuthenticated, hydrate, setUser, setIsAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  const [showPassword, setShowPassword] = React.useState(false);
  const loginErrorMessage =
    (loginMutation.error as any)?.response?.data?.message ||
    (loginMutation.error as any)?.response?.data?.error ||
    (loginMutation.error as any)?.response?.data?.details?.[0]?.message ||
    (loginMutation.error as Error | null)?.message ||
    'Could not sign in. Please confirm your credentials.';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, router, user]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      const authenticatedUser = response?.user ?? null;

      setUser(authenticatedUser);
      setIsAuthenticated(Boolean(authenticatedUser));
      router.replace(authenticatedUser?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-ui-subtle">Sign in to your ANT PRESS account</p>
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
              <Input
                type="email"
                placeholder="Email address"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 pl-10 dark:border-slate-800 dark:bg-slate-900"
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
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
            </div>
            {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}

            <div className="flex justify-end">
              <span className="text-xs font-medium text-amber-600 dark:text-amber-300">
                Secure access
              </span>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>

            {loginMutation.isError && (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                {loginErrorMessage}
              </p>
            )}
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs uppercase tracking-[0.22em] text-ui-subtle">Account Access</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <p className="text-center text-sm text-ui-subtle">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-sky-700 hover:underline dark:text-cyan-300">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
