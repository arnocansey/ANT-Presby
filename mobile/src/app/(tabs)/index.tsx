import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useSermons, useUpcomingEvents } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { APP_NAME } from '@/lib/config';
import { useAuthStore } from '@/store/auth';

export default function HomeScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const { data } = useSermons(1, 1);
  const upcomingEventsQuery = useUpcomingEvents();
  const latestSermon = Array.isArray(data) ? data[0] : null;
  const nextEvent = Array.isArray(upcomingEventsQuery.data) ? upcomingEventsQuery.data[0] : null;
  const greeting = getGreeting();
  const title = APP_NAME.replace(/\s+Mobile$/i, '');

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={styles.greeting}>
            {greeting}
          </ThemedText>
          <ThemedText type="title" style={styles.headerTitle}>
            {title}
          </ThemedText>
        </View>

        <Pressable
          onPress={() => router.push(user ? '/notifications' : ('/news' as never))}
          style={[styles.notificationButton, { backgroundColor: theme.tint }]}>
          <Ionicons name="notifications-outline" size={18} color="#FFFFFF" />
          <View style={styles.notificationDot}>
            <ThemedText type="smallBold" style={styles.notificationDotText}>
              3
            </ThemedText>
          </View>
        </Pressable>
      </View>

      <View style={[styles.liveCard, { backgroundColor: theme.tint }]}>
        <View style={styles.liveBadge}>
          <View style={styles.livePulse} />
          <ThemedText type="smallBold" style={styles.liveBadgeText}>
            Live now
          </ThemedText>
        </View>

        <ThemedText type="subtitle" style={styles.liveTitle}>
          Sunday Worship Service
        </ThemedText>
        <ThemedText type="default" style={styles.liveDescription}>
          Join us as we worship together
        </ThemedText>

        <Pressable onPress={() => router.push('/sermons' as never)} style={styles.watchButton}>
          <Ionicons name="play" size={16} color={theme.tint} />
          <ThemedText type="defaultSemiBold" style={[styles.watchButtonText, { color: theme.tint }]}>
            Watch Live
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/events')}
        style={[styles.nextServiceCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.nextServiceLeft}>
          <View style={[styles.nextServiceIconWrap, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="time-outline" size={16} color={theme.accent} />
          </View>
          <View style={styles.nextServiceCopy}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
              Next Service
            </ThemedText>
            <ThemedText type="defaultSemiBold">
              {nextEvent?.event_date ? new Date(nextEvent.event_date).toLocaleString() : 'Upcoming event schedule will appear here'}
            </ThemedText>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={theme.textSecondary} />
              <ThemedText type="small" themeColor="textSecondary">
                {nextEvent?.location || 'Event location will appear here'}
              </ThemedText>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </Pressable>

      <View style={styles.sectionRow}>
        <ThemedText type="defaultSemiBold">Quick Actions</ThemedText>
      </View>

      <View style={styles.quickActions}>
        <QuickAction
          label="Sermons"
          icon="play-outline"
          color="#245BE7"
          onPress={() => router.push('/sermons' as never)}
        />
        <QuickAction
          label="Events"
          icon="calendar-outline"
          color="#0D9F6E"
          onPress={() => router.push('/events')}
        />
        <QuickAction
          label="Give"
          icon="gift-outline"
          color="#A66706"
          onPress={() => router.push('/donate')}
        />
        <QuickAction
          label="Groups"
          icon="people-outline"
          color="#B0206D"
          onPress={() => router.push('/small-groups' as never)}
        />
      </View>

      <View style={styles.sectionRow}>
        <ThemedText type="defaultSemiBold">Latest Sermon</ThemedText>
        <Pressable onPress={() => router.push('/sermons' as never)}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            See All
          </ThemedText>
        </Pressable>
      </View>

      <Pressable
        onPress={() =>
          latestSermon ? router.push(`/sermons/${latestSermon.id}` as never) : router.push('/sermons' as never)
        }
        style={[styles.sermonCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.sermonMedia}>
          <View style={styles.durationBadge}>
            <ThemedText type="smallBold" style={styles.durationText}>
              42:15
            </ThemedText>
          </View>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={26} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.sermonContent}>
          {latestSermon?.series ? (
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              Series: {latestSermon.series}
            </ThemedText>
          ) : null}
          <ThemedText type="defaultSemiBold">
            {latestSermon?.title || 'Latest sermon will appear here'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {latestSermon?.speaker || 'Speaker details unavailable'} •{' '}
            {latestSermon?.sermon_date
              ? new Date(latestSermon.sermon_date).toLocaleDateString()
              : 'Date unavailable'}
          </ThemedText>
        </View>
      </Pressable>
    </BrandScreen>
  );
}

function QuickAction({
  label,
  icon,
  color,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.quickActionItem}>
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color="#FFFFFF" />
      </View>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.one,
  },
  greeting: {
    color: '#FACC15',
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 31,
    lineHeight: 35,
  },
  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDotText: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 12,
  },
  liveCard: {
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  liveBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#D1FAE5',
  },
  liveBadgeText: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  liveTitle: {
    color: '#FFFFFF',
  },
  liveDescription: {
    color: '#FFF3E2',
  },
  watchButton: {
    marginTop: Spacing.one,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  watchButtonText: {
    fontWeight: '800',
  },
  nextServiceCard: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  nextServiceLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  nextServiceIconWrap: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextServiceCopy: {
    flex: 1,
    gap: 2,
  },
  kicker: {
    textTransform: 'uppercase',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  quickActionIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sermonCard: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sermonMedia: {
    height: 136,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    left: 12,
    bottom: 10,
    backgroundColor: '#111827',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 11,
    lineHeight: 13,
  },
  playCircle: {
    width: 54,
    height: 54,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  sermonContent: {
    padding: Spacing.three,
    gap: 4,
  },
});
