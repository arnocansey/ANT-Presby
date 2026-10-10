'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, MailCheck, Phone, User } from 'lucide-react';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoogleLogin, useRegister } from '@/hooks/useApi';
import { requestGoogleAccessToken } from '@/lib/google-oauth';
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

const iconClass = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted';

export default function RegisterForm() {
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();
  const { setUser, setIsAuthenticated } = useAuthStore();
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

  const handleGoogleRegister = async () => {
    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
      const accessToken = await requestGoogleAccessToken(googleClientId);
      const response = await googleLoginMutation.mutateAsync(accessToken);
      const authenticatedUser = response?.user ?? null;
      setUser(authenticatedUser);
      setIsAuthenticated(Boolean(authenticatedUser));
      window.location.href = authenticatedUser?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    } catch (error) {
      console.error('Google registration error:', error);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-primary text-primary-foreground">
            <User className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Join ANT PRESS</h1>
          <p className="mt-2 text-sm text-muted">Create your account and stay connected</p>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6 sm:p-8">
            {registeredEmail ? (
              <div className="space-y-5" role="status">
                <span className="flex h-12 w-12 items-center justify-center rounded-card bg-success/10 text-success">
                  <MailCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Check your email</h2>
                  <p className="text-sm leading-relaxed text-muted">
                    We sent a verification link to{' '}
                    <span className="break-all font-semibold text-foreground">{registeredEmail}</span>.
                    Open that message and click the link before signing in.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">Go to Sign In</Link>
                  </Button>
                  <Button type="button" size="lg" variant="secondary" onClick={() => setRegisteredEmail(null)}>
                    Register another account
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="register-first-name">First name</Label>
                      <div className="relative">
                        <User className={iconClass} aria-hidden="true" />
                        <Input
                          id="register-first-name"
                          placeholder="First name"
                          className="pl-10"
                          aria-invalid={errors.firstName ? 'true' : undefined}
                          {...register('firstName')}
                        />
                      </div>
                      {errors.firstName && <p className="text-sm text-danger">{errors.firstName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-last-name">Last name</Label>
                      <Input
                        id="register-last-name"
                        placeholder="Last name"
                        aria-invalid={errors.lastName ? 'true' : undefined}
                        {...register('lastName')}
                      />
                      {errors.lastName && <p className="text-sm text-danger">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className={iconClass} aria-hidden="true" />
                      <Input
                        id="register-email"
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
                    <Label htmlFor="register-phone">Phone number</Label>
                    <div className="relative">
                      <Phone className={iconClass} aria-hidden="true" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="Phone number"
                        className="pl-10"
                        aria-invalid={errors.phone ? 'true' : undefined}
                        {...register('phone')}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-danger">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className={iconClass} aria-hidden="true" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create password"
                        className="pl-10 pr-12"
                        aria-invalid={errors.password ? 'true' : undefined}
                        aria-describedby="register-password-hint"
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
                    <p id="register-password-hint" className="text-xs text-muted">
                      At least 8 characters, with an uppercase letter, a lowercase letter and a number.
                    </p>
                    {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm password</Label>
                    <Input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      aria-invalid={errors.confirmPassword ? 'true' : undefined}
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && <p className="text-sm text-danger">{errors.confirmPassword.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="register-terms"
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground/85"
                    >
                      <input
                        id="register-terms"
                        type="checkbox"
                        aria-invalid={errors.acceptedTerms ? 'true' : undefined}
                        {...register('acceptedTerms')}
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span>
                        I agree to the{' '}
                        <Link href="/terms" className="font-semibold text-link hover:underline">
                          Terms and Agreement
                        </Link>
                        .
                      </span>
                    </label>
                    {errors.acceptedTerms && <p className="text-sm text-danger">{errors.acceptedTerms.message}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Button>

                  {registerMutation.isError && <StatusMessage tone="danger">{registerErrorMessage}</StatusMessage>}
                </form>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-[0.14em] text-muted">or use Google</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={handleGoogleRegister}
                  loading={googleLoginMutation.isPending}
                >
                  {googleLoginMutation.isPending ? 'Connecting to Google...' : 'Continue with Google'}
                </Button>

                <p className="text-center text-sm text-muted">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-link hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
