import React from 'react';
import { useForm } from 'react-hook-form';

import { FormMessage, FormTextField, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { getApiErrorMessage, useSubmitContactMessage } from '@/hooks/use-api';

type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactScreen() {
  const submitMutation = useSubmitContactMessage();
  const { control, handleSubmit, reset } = useForm<ContactFormValues>({
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      await submitMutation.mutateAsync(values);
      reset();
    } catch {
      // Inline error handles message.
    }
  };

  const message = submitMutation.isSuccess
    ? 'Message sent successfully.'
    : submitMutation.isError
      ? getApiErrorMessage(submitMutation.error, 'Failed to send message.')
      : '';

  return (
    <Screen>
      <ScreenHeader back eyebrow="Contact" title="Reach the ANT PRESS team" />

      <AppCard>
        <AppText variant="bodyStrong">Send a message</AppText>
        <FormTextField control={control} name="name" label="Name" placeholder="Your name" />
        <FormTextField
          control={control}
          name="email"
          label="Email"
          placeholder="Your email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormTextField control={control} name="subject" label="Subject" placeholder="Message subject" />
        <FormTextField control={control} name="message" label="Message" placeholder="Write your message" multiline />
        <AppButton label="Send message" onPress={handleSubmit(onSubmit)} loading={submitMutation.isPending} />
        {message ? <FormMessage tone={submitMutation.isSuccess ? 'success' : 'danger'}>{message}</FormMessage> : null}
      </AppCard>
    </Screen>
  );
}
