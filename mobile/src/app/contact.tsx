import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useSubmitContactMessage } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactScreen() {
  const theme = useTheme();
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
    <BrandScreen>
      <BrandHero
        eyebrow="Contact"
        title="Reach the ANT PRESS team"
        description="Send a message from mobile using the same backend contact flow as the website."
      />

      <BrandCard>
        <BrandSectionHeader title="Send a message" description="We’ll route your message through the platform contact endpoint." />
        <Field control={control} name="name" label="Name" placeholder="Your name" />
        <Field control={control} name="email" label="Email" placeholder="Your email address" />
        <Field control={control} name="subject" label="Subject" placeholder="Message subject" />
        <Field control={control} name="message" label="Message" placeholder="Write your message" multiline />
        <BrandButton label="Send Message" onPress={handleSubmit(onSubmit)} variant="secondary" />
        {message ? (
          <ThemedText style={{ color: submitMutation.isSuccess ? theme.tint : '#B91C1C' }}>{message}</ThemedText>
        ) : null}
      </BrandCard>
    </BrandScreen>
  );
}

function Field({
  control,
  name,
  label,
  placeholder,
  multiline = false,
}: {
  control: any;
  name: keyof ContactFormValues;
  label: string;
  placeholder: string;
  multiline?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline={multiline}
            style={[
              styles.input,
              multiline && styles.multiline,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
});
