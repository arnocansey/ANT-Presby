import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import {
  BrandButton,
  BrandCard,
  BrandHero,
  BrandPill,
  BrandScreen,
  BrandSectionHeader,
} from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getApiErrorMessage,
  useAdminEvents,
  useCreateAdminEvent,
  useDeleteAdminEvent,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type EventFormValues = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations: string;
};

export default function AdminEventsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const eventsQuery = useAdminEvents(isAdmin);
  const createMutation = useCreateAdminEvent();
  const deleteMutation = useDeleteAdminEvent();

  const { control, handleSubmit, reset } = useForm<EventFormValues>({
    defaultValues: {
      name: '',
      description: '',
      eventDate: '',
      location: '',
      maxRegistrations: '',
    },
  });

  const onSubmit = async (values: EventFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description,
        eventDate: values.eventDate,
        location: values.location,
        maxRegistrations: values.maxRegistrations ? Number(values.maxRegistrations) : null,
      });
      reset();
    } catch {
      // Inline error state handles this.
    }
  };

  if (!user || !isAdmin) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Admin Events"
          title="Admin access required"
          description="Sign in with an admin account to create and manage events from mobile."
        />
      </BrandScreen>
    );
  }

  const events = eventsQuery.data || [];
  const createErrorMessage = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create event.')
    : '';

  return (
    <AdminShell activeTab="/admin-events">
      <BrandHero
        eyebrow="Admin Events"
        title="Manage events on mobile"
        description="Create new events quickly and clean up outdated ones while you’re on the move."
      />

      <BrandCard>
        <BrandSectionHeader
          title="Create an event"
          description="Use ISO date format for the event date, for example 2026-04-12T09:00:00.000Z."
        />

        <FormField control={control} name="name" label="Name" placeholder="Event name" />
        <FormField control={control} name="description" label="Description" placeholder="Event description" multiline />
        <FormField control={control} name="eventDate" label="Event Date" placeholder="2026-04-12T09:00:00.000Z" />
        <FormField control={control} name="location" label="Location" placeholder="Event location" />
        <FormField control={control} name="maxRegistrations" label="Max Registrations" placeholder="Optional capacity" />

        <BrandButton label="Create Event" onPress={handleSubmit(onSubmit)} variant="secondary" />

        {createMutation.isError ? (
          <ThemedText style={styles.errorText}>{createErrorMessage}</ThemedText>
        ) : null}
      </BrandCard>

      <BrandCard>
        <BrandSectionHeader
          title="Recent events"
          description="Review current event records and remove any that should no longer appear."
        />
        {eventsQuery.isLoading ? (
          <ThemedText type="small">Loading events...</ThemedText>
        ) : events.length > 0 ? (
          <View style={styles.list}>
            {events.slice(0, 8).map((event: any) => (
              <View key={String(event?.id)} style={styles.listItem}>
                <View style={styles.headerRow}>
                  <ThemedText type="defaultSemiBold">{event?.name || 'Event'}</ThemedText>
                  <BrandPill>{String(event?.status || 'active')}</BrandPill>
                </View>
                <ThemedText type="small">{event?.event_date || event?.eventDate || 'No date available'}</ThemedText>
                <ThemedText type="small">{event?.location || 'No location provided'}</ThemedText>
                <BrandButton
                  label="Edit Event"
                  onPress={() => router.push(`/admin-events/${event?.id}` as never)}
                  variant="secondary"
                />
                <BrandButton
                  label="Delete Event"
                  onPress={() => deleteMutation.mutate(Number(event?.id))}
                  variant="outline"
                />
              </View>
            ))}
          </View>
        ) : (
          <ThemedText type="small">No events available.</ThemedText>
        )}
      </BrandCard>
    </AdminShell>
  );
}

function FormField({
  control,
  name,
  label,
  placeholder,
  multiline = false,
}: {
  control: any;
  name: keyof EventFormValues;
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
              multiline && styles.multilineInput,
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
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  list: {
    gap: Spacing.two,
  },
  listItem: {
    gap: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorText: {
    color: '#B91C1C',
  },
});
