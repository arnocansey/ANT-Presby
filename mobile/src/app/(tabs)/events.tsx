import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  useMyEventRegistrations,
  useRegisterForEvent,
  useUpcomingEvents,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const eventColors = [
  { bg: 'rgba(168,85,247,0.16)', text: '#C084FC' },
  { bg: 'rgba(34,197,94,0.16)', text: '#4ADE80' },
  { bg: 'rgba(59,130,246,0.16)', text: '#60A5FA' },
  { bg: 'rgba(236,72,153,0.16)', text: '#F472B6' },
];

export default function EventsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading } = useUpcomingEvents();
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const registerMutation = useRegisterForEvent();
  const items = Array.isArray(data) ? data : [];
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));
  const nextEvent = items[0];

  return (
    <BrandScreen>
      <View style={[styles.segmentedWrap, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
        <View style={[styles.segmentActive, { backgroundColor: theme.tint }]}>
          <ThemedText type="defaultSemiBold" style={styles.segmentActiveText}>
            Events
          </ThemedText>
        </View>
        <Pressable onPress={() => router.push('/donate' as never)} style={styles.segmentInactive}>
          <ThemedText type="defaultSemiBold" themeColor="textSecondary">
            Give
          </ThemedText>
        </Pressable>
      </View>

      {nextEvent ? (
        <View style={styles.bannerWrap}>
          <View style={[styles.banner, { backgroundColor: '#6D28D9' }]}>
        <View style={styles.bannerTexture} />
            <ThemedText type="smallBold" style={styles.bannerKicker}>
              Next Event
            </ThemedText>
            <ThemedText type="subtitle" style={styles.bannerTitle}>
              {nextEvent.name}
            </ThemedText>
            <View style={styles.bannerMeta}>
              <MetaLabel icon="time-outline" text={formatBannerDate(nextEvent.event_date)} />
              <MetaLabel icon="location-outline" text={nextEvent.location || 'Location will be announced'} />
            </View>
            <Pressable
              onPress={() =>
                user
                  ? registeredIds.has(nextEvent.id)
                    ? router.push({ pathname: '/events/[id]', params: { id: String(nextEvent.id) } })
                    : registerMutation.mutate(nextEvent.id)
                  : router.push(`/events/${nextEvent.id}` as never)
              }
              style={styles.bannerButton}>
              <ThemedText type="smallBold" style={{ color: '#6D28D9' }}>
                {registeredIds.has(nextEvent.id) ? 'Already Registered' : 'Register Now'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.sectionRow}>
        <ThemedText type="defaultSemiBold">All Events</ThemedText>
        <Pressable style={styles.inlineControl}>
          <Ionicons name="calendar-outline" size={12} color={theme.tint} />
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Calendar View
          </ThemedText>
        </Pressable>
      </View>

      {isLoading ? (
        <EventShellCard>
          <ThemedText type="small">Loading events...</ThemedText>
        </EventShellCard>
      ) : items.length === 0 ? (
        <EventShellCard>
          <ThemedText type="defaultSemiBold">No upcoming events</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            When events are created in ANT PRESS, they will show here.
          </ThemedText>
        </EventShellCard>
      ) : (
        items.map((item: any, index: number) => {
          const palette = eventColors[index % eventColors.length];
          const isRegistered = registeredIds.has(item.id);
          const month = item.event_date
            ? new Date(item.event_date).toLocaleString(undefined, { month: 'short' }).toUpperCase()
            : 'TBD';
          const day = item.event_date ? String(new Date(item.event_date).getDate()).padStart(2, '0') : '--';

          return (
            <Pressable
              key={String(item.id)}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(item.id) } })}
              style={[styles.eventCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
              <View style={[styles.dateBox, { backgroundColor: '#1A1A2E', borderColor: 'rgba(255,255,255,0.1)' }]}>
                <ThemedText type="smallBold" style={{ color: theme.tint }}>
                  {month}
                </ThemedText>
                <ThemedText type="subtitle">{day}</ThemedText>
              </View>

              <View style={styles.eventBody}>
                <View style={[styles.typePill, { backgroundColor: palette.bg }]}>
                  <ThemedText type="smallBold" style={{ color: palette.text }}>
                    {item.type || (index === 0 ? 'Prayer' : 'Community')}
                  </ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                <View style={styles.metaWrap}>
                  <MetaLabel icon="time-outline" text={item.event_time || formatTime(item.event_date)} />
                  <MetaLabel icon="location-outline" text={item.location || 'Location will be announced'} />
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.attendees || item.registration_count || 0} attending
                </ThemedText>
              </View>

              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
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
                style={[styles.chevronButton, { backgroundColor: isRegistered ? 'rgba(255,159,26,0.12)' : 'rgba(255,159,26,0.16)' }]}>
                {user ? (
                  isRegistered ? (
                    <Ionicons name="checkmark" size={18} color={theme.tint} />
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={theme.tint} />
                  )
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={theme.tint} />
                )}
              </Pressable>
            </Pressable>
          );
        })
      )}

      <View style={[styles.giveCard, { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.18)' }]}>
        <View style={styles.giveHeader}>
          <View style={[styles.giveIcon, { backgroundColor: 'rgba(255,159,26,0.16)' }]}>
            <Ionicons name="heart" size={18} color={theme.tint} />
          </View>
          <View>
            <ThemedText type="defaultSemiBold">Support The Mission</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Tithes, offerings & donations
            </ThemedText>
          </View>
        </View>
        <View style={styles.amountRow}>
          {['$25', '$50', '$100'].map((amount) => (
            <Pressable
              key={amount}
              onPress={() => router.push(`/donate?amount=${encodeURIComponent(amount.replace('$', ''))}` as never)}
              style={[styles.amountButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.1)' }]}>
              <ThemedText type="defaultSemiBold">{amount}</ThemedText>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => router.push('/donate' as never)} style={[styles.giveNowButton, { backgroundColor: theme.tint }]}>
          <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
          <ThemedText type="defaultSemiBold" style={styles.segmentActiveText}>
            Give Now
          </ThemedText>
        </Pressable>
      </View>
    </BrandScreen>
  );
}

function EventShellCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.emptyCard}>{children}</View>;
}

function MetaLabel({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.metaLabel}>
      <Ionicons name={icon} size={12} color={theme.textSecondary} />
      <ThemedText type="small" themeColor="textSecondary">
        {text}
      </ThemedText>
    </View>
  );
}

const formatBannerDate = (value?: string) => {
  if (!value) return 'Upcoming date will be announced';
  return new Date(value).toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatTime = (value?: string) => {
  if (!value) return 'Time to be announced';
  return new Date(value).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const styles = StyleSheet.create({
  segmentedWrap: {
    borderRadius: Radius.medium,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
  },
  segmentActive: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentInactive: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActiveText: {
    color: '#FFFFFF',
  },
  bannerWrap: {
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  banner: {
    padding: Spacing.three,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerTexture: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 88,
    opacity: 0.12,
    backgroundColor: '#FFFFFF',
  },
  bannerKicker: {
    color: '#DDD6FE',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    color: '#FFFFFF',
    marginTop: 4,
  },
  bannerMeta: {
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  bannerButton: {
    marginTop: Spacing.three,
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inlineControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  dateBox: {
    width: 48,
    height: 56,
    borderRadius: Radius.small,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventBody: {
    flex: 1,
    gap: 2,
  },
  typePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: 2,
  },
  metaWrap: {
    gap: 2,
  },
  metaLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chevronButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  giveCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  giveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  giveIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  amountButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giveNowButton: {
    minHeight: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
