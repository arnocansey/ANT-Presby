import { router } from 'expo-router';
import React from 'react';

import {
  BrandButton,
  BrandCard,
  BrandHero,
  BrandPill,
  BrandScreen,
} from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import {
  useCancelEventRegistration,
  useMyEventRegistrations,
  useRegisterForEvent,
  useUpcomingEvents,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function EventsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useUpcomingEvents();
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelEventRegistration();
  const items = Array.isArray(data) ? data : [];

  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Events"
        title="Upcoming community events"
        description="Track what is coming up and register from the same event flow used on the website."
      />

      {isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading events...</ThemedText>
        </BrandCard>
      ) : items.length === 0 ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No upcoming events</ThemedText>
          <ThemedText type="small">When events are created in ANT PRESS, they will show here.</ThemedText>
        </BrandCard>
      ) : (
        items.map((item: any) => {
          const isRegistered = registeredIds.has(item.id);

          return (
            <BrandCard key={item.id}>
              <BrandPill>{item.event_date ? new Date(item.event_date).toLocaleDateString() : 'Scheduled'}</BrandPill>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText type="small">{item.location}</ThemedText>
              {item.description ? <ThemedText type="small">{item.description}</ThemedText> : null}
              <BrandButton
                label="View Details"
                onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(item.id) } })}
                variant="outline"
              />
              {user ? (
                <BrandButton
                  label={isRegistered ? 'Cancel Registration' : 'Register'}
                  onPress={() =>
                    isRegistered ? cancelMutation.mutate(item.id) : registerMutation.mutate(item.id)
                  }
                  variant={isRegistered ? 'outline' : 'secondary'}
                />
              ) : (
                <ThemedText type="small">Sign in to register for this event.</ThemedText>
              )}
            </BrandCard>
          );
        })
      )}
    </BrandScreen>
  );
}
