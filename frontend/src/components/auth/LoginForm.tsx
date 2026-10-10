'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoogleLogin, useLogin } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { requestGoogleAccessToken } from '@/lib/google-oauth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const iconClass = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted';

export default function LoginForm() {
  const router = useRouter();
  const { user, isAuthenticated, hydrate, setUser, setIsAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
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

  const handleGoogleLogin = async () => {
    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
      const accessToken = await requestGoogleAccessToken(googleClientId);
      const response = await googleLoginMutation.mutateAsync(accessToken);
      const authenticatedUser = response?.user ?? null;

      setUser(authenticatedUser);
      setIsAuthenticated(Boolean(authenticatedUser));
      router.replace(authenticatedUser?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-primary text-primary-foreground">
            <Lock className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to your ANT PRESS account</p>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className={iconClass} aria-hidden="true" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Email address"
                    className="pl-10"
                    aria-invalid={errors.email ? 'true' : undefined}
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className={iconClass} aria-hidden="true" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="pl-10 pr-12"
                    aria-invalid={errors.password ? 'true' : undefined}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              {loginMutation.isError && <StatusMessage tone="danger">{loginErrorMessage}</StatusMessage>}
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-[0.14em] text-muted">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleGoogleLogin}
              loading={googleLoginMutation.isPending}
            >
              {googleLoginMutation.isPending ? 'Connecting to Google...' : 'Continue with Google'}
            </Button>

            <p className="text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-link hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
