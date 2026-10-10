import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import { FormMessage, FormTextField, LoadingList, Screen, ScreenHeader, SectionHeader, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
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
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin events"
          title="Admin access required"
          subtitle="Sign in with an admin account to create and manage events from mobile."
        />
      </Screen>
    );
  }

  const events = eventsQuery.data || [];
  const createErrorMessage = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create event.')
    : '';

  return (
    <AdminShell activeTab="/admin-events">
      <ScreenHeader back eyebrow="Admin" title="Events" subtitle="Create events quickly and tidy up old ones." />

      <AppCard>
        <AppText variant="section">Create an event</AppText>
        <FormTextField control={control} name="name" label="Name" placeholder="Event name" />
        <FormTextField control={control} name="description" label="Description" placeholder="Event description" multiline />
        <FormTextField
          control={control}
          name="eventDate"
          label="Event date"
          placeholder="2026-04-12T09:00:00.000Z"
          hint="ISO format, for example 2026-04-12T09:00:00.000Z"
          autoCapitalize="none"
        />
        <FormTextField control={control} name="location" label="Location" placeholder="Event location" />
        <FormTextField control={control} name="maxRegistrations" label="Max registrations" placeholder="Optional capacity" keyboardType="number-pad" />
        <AppButton label="Create event" onPress={handleSubmit(onSubmit)} />
        {createMutation.isError ? <FormMessage tone="danger">{createErrorMessage}</FormMessage> : null}
      </AppCard>

      <SectionHeader title="Recent events" />
      {eventsQuery.isLoading ? (
        <LoadingList count={3} height={120} />
      ) : events.length > 0 ? (
        events.slice(0, 8).map((event: any) => (
          <AppCard key={String(event?.id)}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {event?.name || 'Event'}
              </AppText>
              <AppBadge tone={statusTone(event?.status || 'active')}>{String(event?.status || 'active')}</AppBadge>
            </View>
            <AppText variant="small" tone="muted">
              {event?.event_date || event?.eventDate || 'No date available'}
            </AppText>
            <AppText variant="small" tone="muted">
              {event?.location || 'No location provided'}
            </AppText>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton label="Edit event" size="sm" variant="secondary" onPress={() => router.push(`/admin-events/${event?.id}` as never)} />
              </View>
              <View style={styles.flex}>
                <AppButton label="Delete event" size="sm" variant="danger" onPress={() => deleteMutation.mutate(Number(event?.id))} />
              </View>
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyState icon="calendar-outline" title="No events available" />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm },
});
