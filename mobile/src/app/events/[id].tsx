import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ListGroup, ListRow, LoadingList, MediaFrame, Screen, ScreenHeader, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  useCancelEventRegistration,
  useEventById,
  useMyEventRegistrations,
  useRegisterForEvent,
} from '@/hooks/use-api';
import { resolveImageUrl } from '@/lib/media';
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
    <Screen>
      <ScreenHeader back title={data?.name || 'Event'} />

      {isLoading ? (
        <LoadingList count={2} height={160} />
      ) : !data ? (
        <EmptyState
          icon="calendar-outline"
          title="Event not found"
          message="This event may have been removed or is no longer available."
        />
      ) : (
        <>
          <MediaFrame
            uri={resolveImageUrl(data.image_url)}
            icon="calendar-clear-outline"
            height={200}
            accessibilityLabel={`Picture for ${data.name}`}
          />
          <View style={styles.badges}>
            <AppBadge tone={statusTone(data.status)}>{String(data.status || 'Event')}</AppBadge>
          </View>
          <AppText>{data.description || 'Community event details from ANT PRESS.'}</AppText>

          <ListGroup>
            <ListRow
              icon="calendar-outline"
              label={data.event_date ? new Date(data.event_date).toLocaleDateString() : 'Scheduled'}
              description="Date"
            />
            <ListRow
              icon="time-outline"
              label={data.event_date ? new Date(data.event_date).toLocaleTimeString() : 'Time TBD'}
              description="Time"
            />
            <ListRow icon="location-outline" label={data.location || 'No location set'} description="Location" />
            <ListRow icon="people-outline" label={`${data.registered_count ?? 0} registered`} description="Attendees" />
          </ListGroup>

          {data.album_id ? (
            <AppButton
              label="View event photos"
              variant="secondary"
              onPress={() => router.push(`/gallery/${data.album_id}` as never)}
            />
          ) : null}

          {user ? (
            <AppButton
              label={isRegistered ? 'Cancel registration' : 'Reserve my spot'}
              variant={isRegistered ? 'secondary' : 'primary'}
              onPress={() => (isRegistered ? cancelMutation.mutate(data.id) : registerMutation.mutate(data.id))}
            />
          ) : (
            <AppButton label="Sign in to register" onPress={() => router.push('/login')} />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: Space.sm },
});
