'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight sm:text-3xl">Contact Us</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="contact-name">Name</Label>
              <Input
                id="contact-name"
                autoComplete="name"
                {...register('name', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Input
                id="contact-email"
                type="email"
                autoComplete="email"
                {...register('email', { required: true })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject</Label>
              <Input id="contact-subject" {...register('subject', { required: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                rows={6}
                {...register('message', { required: true })}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button type="submit" disabled={isSubmitting || submitContact.isPending}>
                {isSubmitting || submitContact.isPending ? 'Sending...' : 'Send Message'}
              </Button>

              <p aria-live="polite" className="text-sm text-emerald-700 dark:text-emerald-300">
                {status === 'success' ? 'Message sent successfully.' : ''}
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
