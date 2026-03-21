'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle2, Gift, Heart, Shield, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useInitializeDonationPayment } from '@/hooks/useApi';
import apiClient from '@/lib/api';

type DonationForm = {
  amount: string;
  type: 'tithe' | 'offering' | 'ministry' | 'general';
  method: 'card' | 'bank_transfer' | 'momo' | 'cash';
  notes?: string;
};

const funds = [
  { id: 'tithe', label: 'Tithe', description: 'Support consistent church operations', icon: Heart, colorClass: 'text-amber-500' },
  { id: 'offering', label: 'Offering', description: 'Give beyond regular tithe support', icon: Gift, colorClass: 'text-blue-500' },
  { id: 'ministry', label: 'Ministry', description: 'Direct support for ministry growth', icon: TrendingUp, colorClass: 'text-emerald-500' },
  { id: 'general', label: 'General', description: 'Flexible support across current needs', icon: Shield, colorClass: 'text-purple-500' },
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
    <div className="container-max py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Give Online</h1>
        <p className="mt-2 text-ui-subtle">
          Support the mission with secure giving tied to your real ANT PRESS account.
        </p>
      </div>

      {reference && (
        <div className="mx-auto mb-6 max-w-3xl rounded-[1.4rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-ui-subtle">
            Reference: <span className="font-mono">{reference}</span>
          </p>
          {verifyState === 'verifying' && <p className="mt-2 text-sm text-ui-subtle">Verifying payment...</p>}
          {verifyState === 'success' && (
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Payment verified successfully.
            </p>
          )}
          {verifyState === 'failed' && (
            <p className="mt-2 text-sm font-medium text-red-700 dark:text-red-300">
              Verification failed. Please contact support with this reference.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 lg:col-span-3">
          <div>
            <h2 className="mb-3 font-bold text-slate-950 dark:text-white">Choose a fund</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {funds.map((fund) => (
                <button
                  key={fund.id}
                  type="button"
                  onClick={() => setValue('type', fund.id as DonationForm['type'])}
                  className={`flex items-start gap-3 rounded-[1.2rem] border p-4 text-left transition-colors ${
                    selectedType === fund.id
                      ? 'border-sky-300 bg-sky-50 dark:border-cyan-500/50 dark:bg-cyan-500/10'
                      : 'border-slate-200 bg-white hover:border-sky-200 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700'
                  }`}
                >
                  <fund.icon className={`mt-0.5 h-5 w-5 shrink-0 ${fund.colorClass}`} />
                  <div>
                    <p className="font-semibold text-slate-950 dark:text-white">{fund.label}</p>
                    <p className="mt-1 text-xs text-ui-subtle">{fund.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 font-bold text-slate-950 dark:text-white">Quick amounts</h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {quickAmounts.map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
                  onClick={() => setValue('amount', quickAmount)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                    amount === quickAmount
                      ? 'bg-sky-700 text-white dark:bg-cyan-400 dark:text-slate-950'
                      : 'border border-slate-200 bg-white text-slate-600 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  ${quickAmount}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-ui-subtle">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Other amount"
                className="h-12 rounded-xl border-slate-200 bg-white pl-8 text-lg font-bold dark:border-slate-800 dark:bg-slate-950"
                {...register('amount')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-950 dark:text-white">
                Payment method
              </label>
              <select
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                {...register('method')}
              >
                <option value="card">Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="momo">Mobile Money</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-950 dark:text-white">
                Donation type
              </label>
              <select
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                {...register('type')}
              >
                <option value="tithe">Tithe</option>
                <option value="offering">Offering</option>
                <option value="ministry">Ministry</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-950 dark:text-white">
              Notes
            </label>
            <Textarea
              rows={4}
              className="rounded-xl border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
              {...register('notes')}
            />
          </div>

          <Button
            type="submit"
            disabled={initializePayment.isPending}
            className="h-12 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400"
          >
            {initializePayment.isPending
              ? 'Processing...'
              : `Give ${amount ? `$${Number(amount || 0).toFixed(2)}` : 'Now'}`}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-ui-subtle">
            <Shield className="h-3 w-3" />
            Secured by the configured payment flow and your account session
          </div>
        </form>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <div className="rounded-[1.4rem] bg-gradient-to-br from-amber-600 to-orange-600 p-6 text-white">
            <h3 className="text-lg font-black">Why giving matters</h3>
            <p className="mt-2 text-sm text-amber-50">
              Your contribution supports ministry activity, publishing, announcements, and church operations from the same connected platform.
            </p>
            <div className="mt-4 space-y-3">
              {funds.map((fund) => (
                <div key={fund.id} className="rounded-xl bg-white/10 px-4 py-3">
                  <p className="font-semibold">{fund.label}</p>
                  <p className="mt-1 text-xs text-amber-50">{fund.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white">Giving notes</h3>
            <ul className="mt-3 space-y-2 text-sm text-ui-subtle">
              <li>Donations are attached to your account for later review.</li>
              <li>Online checkout may redirect and then return here for verification.</li>
              <li>
                If you are not logged in, please{' '}
                <Link href="/login" className="font-semibold text-sky-700 hover:underline dark:text-cyan-300">
                  sign in first
                </Link>
                .
              </li>
            </ul>
          </div>

          <div className="rounded-[1.4rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <p className="font-semibold text-slate-950 dark:text-white">Real data, real receipts</p>
            </div>
            <p className="mt-2 text-sm text-ui-subtle">
              This page uses the live ANT PRESS donation flow instead of sample checkout data.
            </p>
          </div>
        </div>
      </div>
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
