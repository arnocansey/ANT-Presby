import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  IconButton,
  type IconName,
  ListGroup,
  ErrorState, LoadingList,
  Screen,
  ScreenHeader,
  SectionHeader,
  SignInPrompt,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useMyNotifications } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const notificationIcons: Record<string, IconName> = {
  sermon: 'play-circle-outline',
  event: 'calendar-outline',
  prayer: 'heart-outline',
  giving: 'gift-outline',
  group: 'people-outline',
  announcement: 'notifications-outline',
};

export default function NotificationsScreen() {
  const user = useAuthStore((state) => state.user);
  const notificationsQuery = useMyNotifications(Boolean(user));
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="Notifications" />
        <SignInPrompt
          icon="notifications-outline"
          title="Stay in sync"
          message="Sign in to view personal updates, reminders, and announcements from ANT PRESS."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unread_count ?? 0;
  // Group by the notification date on this phone, not by position in the list.
  const isToday = (value: string) => new Date(value).toDateString() === new Date().toDateString();
  const todayItems = notifications.filter((item: any) => item.created_at && isToday(item.created_at));
  const olderItems = notifications.filter((item: any) => !(item.created_at && isToday(item.created_at)));

  const renderItem = (item: any) => (
    <NotificationRow
      key={String(item.id)}
      item={item}
      unread={!item.is_read}
      onPress={() => !item.is_read && markReadMutation.mutate(item.id)}
    />
  );

  return (
    <Screen>
      <ScreenHeader
        back
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        right={<IconButton icon="checkmark-done-outline" accessibilityLabel="Mark all as read" onPress={() => markAllMutation.mutate()} />}
      />

      {notificationsQuery.isLoading ? (
        <LoadingList />
      ) : notificationsQuery.isError && !notificationsQuery.data ? (
        <ErrorState title="Could not load notifications" onRetry={() => notificationsQuery.refetch()} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          message="Personal updates, event reminders, and announcements will appear here."
        />
      ) : (
        <>
          {todayItems.length > 0 ? (
            <>
              <SectionHeader title="Today" />
              <ListGroup>{todayItems.map(renderItem)}</ListGroup>
            </>
          ) : null}
          {olderItems.length > 0 ? (
            <>
              <SectionHeader title="Earlier" />
              <ListGroup>{olderItems.map(renderItem)}</ListGroup>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function NotificationRow({ item, unread, onPress }: { item: any; unread: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const type = String(item?.type || item?.category || 'announcement').toLowerCase();
  const icon = notificationIcons[type] ?? notificationIcons.announcement;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${item?.title || 'Notification'}`}
      accessibilityHint={unread ? 'Marks it as read' : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}>
      <View style={[styles.icon, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" style={styles.title}>
            {item?.title || 'Notification'}
          </AppText>
          {unread ? <AppBadge tone="danger">New</AppBadge> : null}
        </View>
        <AppText variant="small" tone="muted">
          {item?.message || 'No message available.'}
        </AppText>
        <AppText variant="caption" tone="muted">
          {item?.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Space.sm + 4, padding: Space.md, minHeight: MIN_TOUCH },
  icon: { width: 40, height: 40, borderRadius: Corner.control, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: Space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  title: { flex: 1 },
});
