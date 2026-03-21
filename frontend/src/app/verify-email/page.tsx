'use client';

import Link from 'next/link';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MailCheck, MailWarning } from 'lucide-react';
import { useVerifyEmail } from '@/hooks/useApi';

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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="rounded-[2rem] bg-gradient-to-r from-sky-700 via-cyan-600 to-blue-600 p-8 text-white shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">
            Email Verification
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">Finish activating your account</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">
            We use email verification to confirm new ANT PRESS accounts before sign-in. This keeps
            community access more secure for everyone.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
                status === 'success'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                  : status === 'error'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                    : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
              }`}>
              {status === 'loading' ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : status === 'success' ? (
                <MailCheck className="h-8 w-8" />
              ) : (
                <MailWarning className="h-8 w-8" />
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {status === 'success'
                ? 'Email verified'
                : status === 'error'
                  ? 'Verification issue'
                  : 'Verifying your email'}
            </h2>

            <p className="mt-3 max-w-lg text-sm leading-7 text-ui-muted">{message}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white transition hover:bg-sky-600">
                Go to Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900">
                Back to Register
              </Link>
            </div>

            {status === 'error' ? (
              <p className="mt-6 text-xs text-ui-subtle">
                Need a new link? Use the same email on the sign-in page and we can add a resend
                action there next.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
          <div className="mx-auto flex max-w-2xl justify-center rounded-[1.75rem] border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-3 text-sm text-ui-muted">
              <Loader2 className="h-5 w-5 animate-spin" />
              Preparing verification...
            </div>
          </div>
        </div>
      }>
      <VerifyEmailContent />
    </React.Suspense>
  );
}
