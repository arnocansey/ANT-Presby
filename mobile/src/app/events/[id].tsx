import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  useCancelEventRegistration,
  useEventById,
  useMyEventRegistrations,
  useRegisterForEvent,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function EventDetailScreen() {
  const theme = useTheme();
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
          <View style={styles.heroCard}>
            <View style={styles.heroBar}>
              <Pressable
                onPress={() => router.back()}
                style={[styles.heroIconButton, { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
              </Pressable>
              <View style={styles.heroActions}>
                <Pressable style={[styles.heroIconButton, { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                </Pressable>
                <Pressable style={[styles.heroIconButton, { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <View style={styles.heroCenter}>
              <View style={styles.heroEmojiWrap}>
                <Ionicons name="calendar-clear-outline" size={34} color="#D1FAE5" />
              </View>
              <BrandPill>{data.status || 'Event'}</BrandPill>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <ThemedText type="title" style={styles.titleText}>
              {data.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {data.description || 'Community event details from ANT PRESS.'}
            </ThemedText>
          </View>

          <BrandCard style={styles.countdownCard}>
            <ThemedText type="smallBold" style={{ color: '#FBBF24' }}>
              Starts soon
            </ThemedText>
            <View style={styles.detailsRow}>
              <DetailItem icon="calendar-outline" value={data.event_date ? new Date(data.event_date).toLocaleDateString() : 'Scheduled'} />
              <DetailItem icon="time-outline" value={data.event_date ? new Date(data.event_date).toLocaleTimeString() : 'Time TBD'} />
            </View>
          </BrandCard>

          <BrandCard>
            <ThemedText type="defaultSemiBold">Event details</ThemedText>
            <DetailLine icon="location-outline" text={data.location || 'No location set'} />
            <DetailLine icon="people-outline" text={`Registered attendees: ${data.registered_count ?? 0}`} />
            <DetailLine icon="checkmark-circle-outline" text={`Status: ${data.status || 'active'}`} />
          </BrandCard>

          <View style={styles.actionRow}>
            <Pressable style={[styles.reminderButton, { borderColor: theme.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
              <Ionicons name="notifications-outline" size={18} color={theme.textSecondary} />
            </Pressable>
            {user ? (
              <BrandButton
                label={isRegistered ? 'Cancel Registration' : 'Reserve My Spot'}
                onPress={() =>
                  isRegistered ? cancelMutation.mutate(data.id) : registerMutation.mutate(data.id)
                }
                variant={isRegistered ? 'outline' : 'secondary'}
              />
            ) : (
              <BrandButton label="Sign In To Register" onPress={() => router.push('/login')} />
            )}
          </View>
        </>
      )}
    </BrandScreen>
  );
}

function DetailItem({
  icon,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={14} color={theme.textSecondary} />
      <ThemedText type="small">{value}</ThemedText>
    </View>
  );
}

function DetailLine({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  text: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.detailLine}>
      <Ionicons name={icon} size={15} color={theme.textSecondary} />
      <ThemedText type="small">{text}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 220,
    borderRadius: Radius.large,
    padding: Spacing.three,
    overflow: 'hidden',
    backgroundColor: '#0F766E',
    justifyContent: 'space-between',
  },
  heroBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  heroIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenter: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  heroEmojiWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    gap: Spacing.one,
  },
  titleText: {
    fontSize: 28,
    lineHeight: 32,
  },
  countdownCard: {
    gap: Spacing.two,
  },
  detailsRow: {
    gap: Spacing.two,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  reminderButton: {
    width: 52,
    height: 52,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
