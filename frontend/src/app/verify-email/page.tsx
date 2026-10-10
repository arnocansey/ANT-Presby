'use client';

import Link from 'next/link';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MailCheck, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerifyEmail } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const verifyEmail = useVerifyEmail();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('Preparing verification...');

  React.useEffect(() => {
    let active = true;

    const runVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('This verification link is incomplete. Please request a new verification email.');
        return;
      }

      setStatus('loading');
      setMessage('Verifying your email...');

      try {
        const response = await verifyEmail.mutateAsync(token);
        if (!active) return;

        setStatus('success');
        setMessage(response?.message || 'Email verified successfully. You can sign in now.');
      } catch (error: any) {
        if (!active) return;

        const apiMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'Verification failed';

        setStatus('error');
        setMessage(apiMessage);
      }
    };

    runVerification();

    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  const toneClass =
    status === 'success'
      ? 'bg-success/10 text-success'
      : status === 'error'
        ? 'bg-warning/10 text-warning'
        : 'bg-primary/10 text-primary';

  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Email verification</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Finish activating your account</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            We use email verification to confirm new ANT PRESS accounts before sign-in. This keeps community access more
            secure for everyone.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center" aria-live="polite">
            <span className={cn('mb-5 flex h-16 w-16 items-center justify-center rounded-panel', toneClass)}>
              {status === 'loading' ? (
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
              ) : status === 'success' ? (
                <MailCheck className="h-8 w-8" aria-hidden="true" />
              ) : (
                <MailWarning className="h-8 w-8" aria-hidden="true" />
              )}
            </span>

            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {status === 'success'
                ? 'Email verified'
                : status === 'error'
                  ? 'Verification issue'
                  : 'Verifying your email'}
            </h2>

            <p className="mt-3 max-w-lg break-words text-sm leading-relaxed text-muted">{message}</p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">Go to Sign In</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/register">Back to Register</Link>
              </Button>
            </div>

            {status === 'error' ? (
              <p className="mt-6 text-xs text-muted">
                Need a new link? Use the same email on the sign-in page and we can add a resend action there next.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container-max py-12 sm:py-16">
          <Card className="mx-auto max-w-xl">
            <CardContent className="flex items-center justify-center gap-3 p-8 text-sm text-muted" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Preparing verification...
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
