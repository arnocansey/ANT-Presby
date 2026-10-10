import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ErrorState,
  IconButton,
  ListGroup,
  ListRow,
  LoadingList,
  Screen,
  Scripture,
  SectionHeader,
} from '@/components/kit';
import { LiveCard } from '@/components/live-card';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AppTile } from '@/components/ui/tile';
import { Corner, Space } from '@/constants/tokens';
import { useLiveStream, useTodayDevotional, useUpcomingEvents } from '@/hooks/use-api';
import { APP_NAME } from '@/lib/config';
import { useAuthStore } from '@/store/auth';

type TileIcon = React.ComponentProps<typeof AppTile>['icon'];

// The same destinations as the website hub (frontend/src/lib/navigation.ts HUB_LINKS), mapped to app routes.
// The app has no /live screen; Watch shows the live card, so "Live" opens Watch.
const HUB_TILES: { label: string; description: string; icon: TileIcon; href: string; live?: boolean }[] = [
  { label: 'Live', description: 'Join the service online', icon: 'radio-outline', href: '/sermons', live: true },
  { label: 'Devotional', description: "Today's reading and prayer", icon: 'book-outline', href: '/daily-devotional' },
  { label: 'Small groups', description: 'Grow together in the week', icon: 'people-outline', href: '/small-groups' },
  { label: 'Prayer wall', description: 'Pray for one another', icon: 'heart-outline', href: '/prayer-wall' },
  { label: 'Gallery', description: 'Photos from services and events', icon: 'images-outline', href: '/gallery' },
  { label: 'News', description: 'Updates from the church', icon: 'newspaper-outline', href: '/news' },
  { label: 'Community', description: 'Stories from members', icon: 'chatbubbles-outline', href: '/community' },
  { label: 'Ministries', description: 'Serve and connect', icon: 'sparkles-outline', href: '/ministries' },
];

const formatEventDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Date to be announced';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const upcomingEventsQuery = useUpcomingEvents();
  const devotionalQuery = useTodayDevotional();
  const liveQuery = useLiveStream();
  const events = Array.isArray(upcomingEventsQuery.data) ? upcomingEventsQuery.data.slice(0, 3) : [];
  const devotional = devotionalQuery.data;
  const isLive = Boolean(liveQuery.data?.is_live);
  const title = APP_NAME.replace(/\s+Mobile$/i, '');
  const name = user?.first_name ? `, ${user.first_name}` : '';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="small" tone="muted">
            {`${getGreeting()}${name}`}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
        </View>
        <IconButton icon="search-outline" accessibilityLabel="Search" onPress={() => router.push('/search' as never)} />
        <IconButton
          icon="notifications-outline"
          accessibilityLabel={user ? 'Notifications' : 'News'}
          onPress={() => router.push(user ? '/notifications' : ('/news' as never))}
        />
      </View>

      <LiveCard />

      <SectionHeader
        title={devotional && devotional.is_today === false ? 'Latest devotional' : "Today's devotional"}
        actionLabel="Open"
        onAction={() => router.push('/daily-devotional' as never)}
      />
      {devotionalQuery.isLoading ? (
        <Skeleton height={132} radius={Corner.card} />
      ) : devotionalQuery.isError ? (
        <ErrorState title="Could not load the devotional" onRetry={() => devotionalQuery.refetch()} />
      ) : devotional ? (
        <AppCard
          onPress={() => router.push('/daily-devotional' as never)}
          accessibilityLabel={`Devotional: ${devotional.title}`}>
          <AppText variant="bodyStrong">{devotional.title}</AppText>
          <Scripture text={devotional.scripture_text} reference={devotional.scripture_reference} lines={3} />
        </AppCard>
      ) : (
        <EmptyState icon="book-outline" title="No devotional yet" message="Today's reading will appear here once it is published." />
      )}

      <SectionHeader title="Explore" />
      <View style={styles.grid}>
        {HUB_TILES.map((tile) => (
          <View key={tile.label} style={styles.gridItem}>
            <AppTile
              icon={tile.icon}
              label={tile.label}
              description={tile.description}
              onPress={() => router.push(tile.href as never)}
              badge={tile.live && isLive ? <AppBadge tone="live">Live</AppBadge> : undefined}
            />
          </View>
        ))}
      </View>

      <SectionHeader title="Upcoming events" actionLabel="See all" onAction={() => router.push('/events')} />
      {upcomingEventsQuery.isLoading ? (
        <LoadingList count={2} height={64} />
      ) : upcomingEventsQuery.isError ? (
        <ErrorState title="Could not load events" onRetry={() => upcomingEventsQuery.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No upcoming events" message="New events will show here." />
      ) : (
        <ListGroup>
          {events.map((event: any) => (
            <ListRow
              key={String(event.id)}
              icon="calendar-outline"
              label={event.name || 'Event'}
              description={[formatEventDate(event.event_date), event.location].filter(Boolean).join(' · ')}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(event.id) } })}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  headerCopy: { flex: 1, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  gridItem: { flexBasis: '47%', flexGrow: 1 },
});
