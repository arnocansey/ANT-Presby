import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAdminEvents, useUpdateAdminEvent } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type EventFormValues = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations: string;
};

export default function AdminEventEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const eventsQuery = useAdminEvents(isAdmin);
  const updateMutation = useUpdateAdminEvent();
  const { control, handleSubmit, reset } = useForm<EventFormValues>({
    defaultValues: { name: '', description: '', eventDate: '', location: '', maxRegistrations: '' },
  });

  const event = React.useMemo(
    () => (eventsQuery.data || []).find((item: any) => String(item?.id) === String(params.id)),
    [eventsQuery.data, params.id]
  );

  React.useEffect(() => {
    if (event) {
      reset({
        name: event.name || '',
        description: event.description || '',
        eventDate: event.event_date || event.eventDate || '',
        location: event.location || '',
        maxRegistrations: event.max_registrations ? String(event.max_registrations) : '',
      });
    }
  }, [event, reset]);

  const onSubmit = async (values: EventFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: Number(params.id),
        payload: {
          name: values.name,
          description: values.description,
          eventDate: values.eventDate,
          location: values.location,
          maxRegistrations: values.maxRegistrations ? Number(values.maxRegistrations) : null,
        },
      });
      router.back();
    } catch {
      // inline error handles this
    }
  };

  if (!user || !isAdmin) {
    return (
      <BrandScreen>
        <BrandHero eyebrow="Edit Event" title="Admin access required" description="Sign in with an admin account to edit events." />
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <BrandHero eyebrow="Edit Event" title={event?.name || 'Edit event'} description="Update an event record from the mobile admin app." />
      <BrandCard>
        <BrandPill>Edit</BrandPill>
        <BrandSectionHeader title="Edit event" description="Adjust the key event details and save them back to ANT PRESS." />
        {!event ? (
          <ThemedText type="small">Loading event...</ThemedText>
        ) : (
          <>
            <Field control={control} name="name" label="Name" placeholder="Event name" />
            <Field control={control} name="description" label="Description" placeholder="Event description" multiline />
            <Field control={control} name="eventDate" label="Event Date" placeholder="2026-04-12T09:00:00.000Z" />
            <Field control={control} name="location" label="Location" placeholder="Event location" />
            <Field control={control} name="maxRegistrations" label="Max Registrations" placeholder="Optional capacity" />
            <BrandButton label="Save Changes" onPress={handleSubmit(onSubmit)} variant="secondary" />
            {updateMutation.isError ? (
              <ThemedText style={styles.errorText}>{getApiErrorMessage(updateMutation.error, 'Failed to update event.')}</ThemedText>
            ) : null}
          </>
        )}
      </BrandCard>
    </BrandScreen>
  );
}

function Field({ control, name, label, placeholder, multiline = false }: { control: any; name: keyof EventFormValues; label: string; placeholder: string; multiline?: boolean }) {
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
            style={[styles.input, multiline && styles.multiline, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  errorText: { color: '#B91C1C' },
});
