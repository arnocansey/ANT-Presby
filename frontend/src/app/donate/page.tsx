'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle2, Gift, Heart, Shield, TrendingUp } from 'lucide-react';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInitializeDonationPayment } from '@/hooks/useApi';
import apiClient from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

type DonationForm = {
  amount: string;
  type: 'tithe' | 'offering' | 'ministry' | 'general';
  method: 'card' | 'bank_transfer' | 'momo' | 'cash';
  notes?: string;
};

const funds = [
  { id: 'tithe', label: 'Tithe', description: 'Support consistent church operations', icon: Heart },
  { id: 'offering', label: 'Offering', description: 'Give beyond regular tithe support', icon: Gift },
  { id: 'ministry', label: 'Ministry', description: 'Direct support for ministry growth', icon: TrendingUp },
  { id: 'general', label: 'General', description: 'Flexible support across current needs', icon: Shield },
];

const quickAmounts = ['25', '50', '100', '250', '500'];

function DonateContent() {
  const { register, handleSubmit, setValue, watch } = useForm<DonationForm>({
    defaultValues: {
      amount: '',
      type: 'tithe',
      method: 'card',
      notes: '',
    },
  });
  const initializePayment = useInitializeDonationPayment();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const verifiedRef = useRef<string | null>(null);
  const amount = watch('amount');
  const selectedType = watch('type');

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
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Give"
        title="Give online"
        description="Support the mission with secure giving tied to your ANT PRESS account."
      />

      {reference && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="break-all text-sm text-muted">
              Reference: <span className="font-mono text-foreground">{reference}</span>
            </p>
            <div aria-live="polite">
              {verifyState === 'verifying' && <StatusMessage tone="info">Verifying payment...</StatusMessage>}
              {verifyState === 'success' && <StatusMessage tone="success">Payment verified successfully.</StatusMessage>}
              {verifyState === 'failed' && (
                <StatusMessage tone="danger">Verification failed. Please contact support with this reference.</StatusMessage>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <fieldset>
                <legend className="mb-3 font-semibold text-foreground">Choose a fund</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {funds.map((fund) => {
                    const selected = selectedType === fund.id;
                    return (
                      <button
                        key={fund.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setValue('type', fund.id as DonationForm['type'])}
                        className={cn(
                          'flex min-h-11 items-start gap-3 rounded-card border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/40'
                        )}
                      >
                        <fund.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        <span>
                          <span className="block font-semibold text-foreground">{fund.label}</span>
                          <span className="mt-1 block text-xs text-muted">{fund.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 font-semibold text-foreground">Amount</legend>
                <div className="mb-4 flex flex-wrap gap-2">
                  {quickAmounts.map((quickAmount) => {
                    const selected = amount === quickAmount;
                    return (
                      <button
                        key={quickAmount}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setValue('amount', quickAmount)}
                        className={cn(
                          'h-11 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-input bg-background text-foreground hover:bg-surface'
                        )}
                      >
                        {formatCurrency(quickAmount, 0)}
                      </button>
                    );
                  })}
                </div>
                <Label htmlFor="donation-amount" className="mb-2 block">
                  Other amount (GH₵)
                </Label>
                {/* GH₵ sits in its own box beside the input, so it can never overlap the placeholder or the digits. */}
                <div className="flex h-12 overflow-hidden rounded-lg border border-input bg-background transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
                  <span
                    className="flex shrink-0 items-center border-r border-input bg-surface px-3 text-base font-semibold text-muted"
                    aria-hidden="true"
                  >
                    GH₵
                  </span>
                  <Input
                    id="donation-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Other amount"
                    className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent text-lg font-semibold focus:ring-0"
                    {...register('amount')}
                  />
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="donation-method">Payment method</Label>
                  <Select id="donation-method" {...register('method')}>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="momo">Mobile Money</option>
                    <option value="cash">Cash</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donation-type">Donation type</Label>
                  <Select id="donation-type" {...register('type')}>
                    <option value="tithe">Tithe</option>
                    <option value="offering">Offering</option>
                    <option value="ministry">Ministry</option>
                    <option value="general">General</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donation-notes">Notes</Label>
                <Textarea id="donation-notes" rows={4} {...register('notes')} />
              </div>

              <Button type="submit" size="lg" loading={initializePayment.isPending}>
                {initializePayment.isPending ? 'Processing...' : `Give ${amount ? formatCurrency(amount) : 'Now'}`}
              </Button>

              <p className="flex items-center justify-center gap-2 text-center text-xs text-muted">
                <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Secured by the configured payment flow and your account session
              </p>
            </form>
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-5 lg:col-span-2">
          <div className="rounded-panel bg-primary p-6 text-primary-foreground">
            <h2 className="text-lg font-semibold">Why giving matters</h2>
            <p className="mt-2 text-sm text-primary-foreground/85">
              Your contribution supports ministry activity, publishing, announcements and church operations.
            </p>
            <ul className="mt-4 space-y-3">
              {funds.map((fund) => (
                <li key={fund.id} className="rounded-lg bg-primary-foreground/10 px-4 py-3">
                  <p className="font-semibold">{fund.label}</p>
                  <p className="mt-1 text-xs text-primary-foreground/85">{fund.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold text-foreground">Giving notes</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                <li>Donations are attached to your account for later review.</li>
                <li>Online checkout may redirect and then return here for verification.</li>
                <li>
                  If you are not logged in, please{' '}
                  <Link href="/login" className="font-semibold text-link hover:underline">
                    sign in first
                  </Link>
                  .
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <h2 className="font-semibold text-foreground">Real data, real receipts</h2>
              </div>
              <p className="mt-2 text-sm text-muted">
                Gifts go through the church&apos;s live donation flow and are recorded against your account.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense
      fallback={
        <div className="container-max py-12">
          <SkeletonGrid count={2} className="md:grid-cols-2" />
        </div>
      }
    >
      <DonateContent />
    </Suspense>
  );
}
