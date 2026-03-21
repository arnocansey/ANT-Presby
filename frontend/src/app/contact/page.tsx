'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Mail, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitContactMessage } from '@/hooks/useApi';

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactPage() {
  const [status, setStatus] = React.useState<'idle' | 'success'>('idle');
  const submitContact = useSubmitContactMessage();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    try {
      await submitContact.mutateAsync(data);
      setStatus('success');
      reset();
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div className="container-max py-10">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
          Contact
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
          Start the conversation
        </h1>
        <p className="mt-3 text-ui-subtle">
          Use the real ANT PRESS contact flow to send a message, ask a question, or request information from the team.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          {[
            {
              icon: User,
              title: 'General inquiry',
              description: 'Use this form for questions about content, ministries, or next steps.',
            },
            {
              icon: Mail,
              title: 'Response workflow',
              description: 'Messages are sent through the live backend instead of sample inbox content.',
            },
            {
              icon: MessageSquare,
              title: 'Clear follow-up',
              description: 'Give enough context in the subject and message fields so the team can respond well.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="inline-flex rounded-2xl bg-amber-500/10 p-3 text-amber-500">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-950 dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ui-muted">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                placeholder="Your name"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                {...register('name', { required: true })}
              />
              <Input
                type="email"
                placeholder="Email address"
                className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
                {...register('email', { required: true })}
              />
            </div>

            <Input
              placeholder="Subject"
              className="h-12 rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
              {...register('subject', { required: true })}
            />

            <Textarea
              rows={7}
              placeholder="Write your message..."
              className="rounded-xl border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
              {...register('message', { required: true })}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                disabled={isSubmitting || submitContact.isPending}
                className="h-12 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                {isSubmitting || submitContact.isPending ? 'Sending...' : 'Send Message'}
              </Button>

              <p aria-live="polite" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {status === 'success' ? 'Message sent successfully.' : ''}
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
