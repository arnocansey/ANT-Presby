'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Mail, MessageSquare, User } from 'lucide-react';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitContactMessage } from '@/hooks/useApi';

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const contactPoints = [
  {
    icon: User,
    title: 'General inquiry',
    description: 'Use this form for questions about content, ministries, or next steps.',
  },
  {
    icon: Mail,
    title: 'Straight to the team',
    description: 'Messages go directly to the church team, who reply by email.',
  },
  {
    icon: MessageSquare,
    title: 'Clear follow-up',
    description: 'Give enough context in the subject and message fields so the team can respond well.',
  },
];

export default function ContactPage() {
  const [status, setStatus] = React.useState<'idle' | 'success'>('idle');
  const submitContact = useSubmitContactMessage();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
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
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Contact"
        title="Start the conversation"
        description="Send a message, ask a question, or request information from the team."
        breadcrumb={[{ label: 'About', href: '/about' }, { label: 'Contact' }]}
      />

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          {contactPoints.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    placeholder="Your name"
                    aria-invalid={errors.name ? 'true' : undefined}
                    {...register('name', { required: true })}
                  />
                  {errors.name && <p className="text-sm text-danger">Please enter your name.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="Email address"
                    aria-invalid={errors.email ? 'true' : undefined}
                    {...register('email', { required: true })}
                  />
                  {errors.email && <p className="text-sm text-danger">Please enter your email address.</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  placeholder="Subject"
                  aria-invalid={errors.subject ? 'true' : undefined}
                  {...register('subject', { required: true })}
                />
                {errors.subject && <p className="text-sm text-danger">Please add a subject.</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  rows={7}
                  placeholder="Write your message..."
                  aria-invalid={errors.message ? 'true' : undefined}
                  {...register('message', { required: true })}
                />
                {errors.message && <p className="text-sm text-danger">Please write a message.</p>}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" size="lg" loading={isSubmitting || submitContact.isPending}>
                  {isSubmitting || submitContact.isPending ? 'Sending...' : 'Send Message'}
                </Button>

                <div aria-live="polite">
                  {status === 'success' ? <StatusMessage tone="success">Message sent successfully.</StatusMessage> : null}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
