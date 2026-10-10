import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState, IconButton, InfoLine, LoadingList, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Space } from '@/constants/tokens';
import { useMyEventRegistrations, useRegisterForEvent, useUpcomingEvents } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatCedis } from '@/lib/currency';
import { resolveImageUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth';

export default function EventsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, refetch } = useUpcomingEvents();
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const registerMutation = useRegisterForEvent();
  const items = Array.isArray(data) ? data : [];
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));
  const nextEvent = items[0];

  return (
    <Screen>
      <ScreenHeader title="Events" subtitle="Services, gatherings and ways to serve" />

      {nextEvent ? (
        <AppCard>
          <AppBadge tone="gold">Next event</AppBadge>
          <AppText variant="section">{nextEvent.name}</AppText>
          <InfoLine icon="time-outline">{formatBannerDate(nextEvent.event_date)}</InfoLine>
          <InfoLine icon="location-outline">{nextEvent.location || 'Location will be announced'}</InfoLine>
          <AppButton
            label={registeredIds.has(nextEvent.id) ? 'Already registered' : 'Register now'}
            variant={registeredIds.has(nextEvent.id) ? 'secondary' : 'primary'}
            onPress={() =>
              user
                ? registeredIds.has(nextEvent.id)
                  ? router.push({ pathname: '/events/[id]', params: { id: String(nextEvent.id) } })
                  : registerMutation.mutate(nextEvent.id)
                : router.push(`/events/${nextEvent.id}` as never)
            }
          />
        </AppCard>
      ) : null}

      <SectionHeader title="All events" />

      {isLoading ? (
        <LoadingList count={3} height={96} />
      ) : isError ? (
        <ErrorState title="Could not load events" onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No upcoming events" message="When events are created, they will show here." />
      ) : (
        items.map((item: any) => {
          const isRegistered = registeredIds.has(item.id);
          const image = resolveImageUrl(item.image_url);

          return (
            <AppCard
              key={String(item.id)}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(item.id) } })}
              accessibilityLabel={`Open ${item.name}`}
              style={styles.eventCard}>
              <DateBox value={item.event_date} />
              <View style={styles.eventBody}>
                {item.type ? <AppBadge>{String(item.type)}</AppBadge> : null}
                <AppText variant="bodyStrong">{item.name}</AppText>
                <InfoLine icon="time-outline">{item.event_time || formatTime(item.event_date)}</InfoLine>
                <InfoLine icon="location-outline">{item.location || 'Location will be announced'}</InfoLine>
                <AppText variant="small" tone="muted">
                  {`${item.attendees || item.registration_count || 0} attending`}
                </AppText>
              </View>
              {image ? (
                <Image source={{ uri: image }} style={styles.thumb} contentFit="cover" accessibilityIgnoresInvertColors />
              ) : null}
              <IconButton
                icon={user && isRegistered ? 'checkmark' : 'chevron-forward'}
                variant="ghost"
                accessibilityLabel={!user ? 'Sign in to register' : isRegistered ? `Registered for ${item.name}` : `Register for ${item.name}`}
                onPress={() => {
                  if (!user) {
                    router.push('/login');
                    return;
                  }
                  if (isRegistered) {
                    router.push({ pathname: '/events/[id]', params: { id: String(item.id) } });
                  } else {
                    registerMutation.mutate(item.id);
                  }
                }}
              />
            </AppCard>
          );
        })
      )}

      <AppCard>
        <AppText variant="bodyStrong">Support the mission</AppText>
        <AppText variant="small" tone="muted">
          Tithes, offerings and donations
        </AppText>
        <View style={styles.amountRow}>
          {[25, 50, 100].map((amount) => (
            <View key={amount} style={styles.amount}>
              <AppButton
                label={formatCedis(amount, 0)}
                variant="secondary"
                size="sm"
                onPress={() => router.push(`/donate?amount=${amount}` as never)}
              />
            </View>
          ))}
        </View>
        <AppButton label="Give now" onPress={() => router.push('/donate' as never)} />
      </AppCard>
    </Screen>
  );
}

function DateBox({ value }: { value?: string }) {
  const { colors } = useAppTheme();
  const month = value ? new Date(value).toLocaleString(undefined, { month: 'short' }).toUpperCase() : 'TBD';
  const day = value ? String(new Date(value).getDate()).padStart(2, '0') : '--';
  return (
    <View style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="caption" tone="primary">
        {month}
      </AppText>
      <AppText variant="section">{day}</AppText>
    </View>
  );
}

const formatBannerDate = (value?: string) => {
  if (!value) return 'Upcoming date will be announced';
  return new Date(value).toLocaleString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const formatTime = (value?: string) => {
  if (!value) return 'Time to be announced';
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const styles = StyleSheet.create({
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  eventBody: { flex: 1, gap: 2 },
  dateBox: { width: 52, minHeight: 60, borderRadius: Corner.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 56, height: 56, borderRadius: Corner.control },
  amountRow: { flexDirection: 'row', gap: Space.sm },
  amount: { flex: 1 },
});
