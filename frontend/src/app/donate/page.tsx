'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useInitializeDonationPayment } from '@/hooks/useApi';
import apiClient from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type DonationForm = {
  amount: string;
  type: 'tithe' | 'offering' | 'ministry' | 'general';
  method: 'card' | 'bank_transfer' | 'momo' | 'cash';
  notes?: string;
};

function DonateContent() {
  const { register, handleSubmit } = useForm<DonationForm>({
    defaultValues: {
      type: 'tithe',
      method: 'card',
    },
  });
  const initializePayment = useInitializeDonationPayment();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const verifiedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!reference || verifiedRef.current === reference) return;

    verifiedRef.current = reference;
    setVerifyState('verifying');

    apiClient
      .get(`/donations/verify/${reference}`)
      .then(() => {
        setVerifyState('success');
        toast.success('Donation payment verified');
      })
      .catch(() => {
        setVerifyState('failed');
        toast.error('Could not verify this payment reference');
      });
  }, [reference]);

  const onSubmit = async (data: DonationForm) => {
    try {
      const result = await initializePayment.mutateAsync({
        amount: Number(data.amount),
        donationType: data.type,
        paymentMethod: data.method,
        notes: data.notes,
      });

      const paymentUrl = result?.payment?.authorization_url;
      if (paymentUrl && typeof window !== 'undefined') {
        window.location.href = paymentUrl;
        return;
      }

      toast.success('Donation initialized');
    } catch {
      // handled by hook
    }
  };

  return (
    <div className="container-max space-y-4 py-12 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Give</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-ui-muted">
          <p>
            Donations are attached to your account so you can review your giving history later from your dashboard.
          </p>
          <p>
            When online payment is configured, you will be redirected to the payment provider and then returned here for verification.
          </p>
          <p>
            If you are not logged in, please <Link href="/login" className="font-semibold text-sky-700 hover:underline dark:text-cyan-300">sign in first</Link> before starting a donation.
          </p>
        </CardContent>
      </Card>

      {reference && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-ui-muted">
              Reference: <span className="font-mono">{reference}</span>
            </p>
            <div aria-live="polite">
              {verifyState === 'verifying' && <p className="mt-1 text-sm text-ui-subtle">Verifying payment...</p>}
              {verifyState === 'success' && (
                <p className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Payment verified successfully.
                </p>
              )}
              {verifyState === 'failed' && (
                <p className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
                  Verification failed. Please contact support with this reference.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Donation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="donate-amount">Amount</Label>
              <Input id="donate-amount" type="number" step="0.01" min="0" {...register('amount')} />
              <p className="text-xs text-ui-subtle">Enter the amount you want to give.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="donate-type">Type</Label>
              <select
                id="donate-type"
                {...register('type')}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="tithe">Tithe</option>
                <option value="offering">Offering</option>
                <option value="ministry">Ministry</option>
                <option value="general">General</option>
              </select>
              <p className="text-xs text-ui-subtle">Choose where this donation should be applied.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="donate-method">Payment Method</Label>
              <select
                id="donate-method"
                {...register('method')}
                className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="momo">Mobile Money</option>
                <option value="cash">Cash</option>
              </select>
              <p className="text-xs text-ui-subtle">Card and mobile money can redirect to checkout when payment is enabled.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="donate-notes">Notes</Label>
              <Textarea id="donate-notes" rows={3} {...register('notes')} />
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit" disabled={initializePayment.isPending}>
                {initializePayment.isPending ? 'Processing...' : 'Continue to Donation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense fallback={<div className="container-max py-12 text-sm text-ui-subtle">Loading donation page...</div>}>
      <DonateContent />
    </Suspense>
  );
}
