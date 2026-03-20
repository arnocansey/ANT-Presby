import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import {
  useCancelEventRegistration,
  useEventById,
  useMyEventRegistrations,
  useRegisterForEvent,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function EventDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const user = useAuthStore((state) => state.user);
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading } = useEventById(id, Boolean(id));
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelEventRegistration();
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));
  const isRegistered = data?.id ? registeredIds.has(data.id) : false;

  return (
    <BrandScreen>
      {isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading event...</ThemedText>
        </BrandCard>
      ) : !data ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">Event not found</ThemedText>
          <ThemedText type="small">This event may have been removed or is no longer available.</ThemedText>
        </BrandCard>
      ) : (
        <>
          <BrandHero
            eyebrow="Event"
            title={data.name}
            description={data.description || 'Community event details from ANT PRESS.'}
          >
            <BrandPill>{data.event_date ? new Date(data.event_date).toLocaleDateString() : 'Scheduled'}</BrandPill>
          </BrandHero>

          <BrandCard>
            <ThemedText type="defaultSemiBold">Event details</ThemedText>
            <ThemedText type="small">{data.location || 'No location set'}</ThemedText>
            <ThemedText type="small">
              {data.event_date ? new Date(data.event_date).toLocaleString() : 'Date to be announced'}
            </ThemedText>
            {data.registered_count !== undefined ? (
              <ThemedText type="small">{`Registered attendees: ${data.registered_count}`}</ThemedText>
            ) : null}
          </BrandCard>

          <BrandCard>
            <ThemedText type="defaultSemiBold">Registration</ThemedText>
            {user ? (
              <BrandButton
                label={isRegistered ? 'Cancel Registration' : 'Register For Event'}
                onPress={() =>
                  isRegistered ? cancelMutation.mutate(data.id) : registerMutation.mutate(data.id)
                }
                variant={isRegistered ? 'outline' : 'secondary'}
              />
            ) : (
              <BrandButton label="Sign In To Register" onPress={() => router.push('/login')} />
            )}
          </BrandCard>
        </>
      )}
    </BrandScreen>
  );
}
