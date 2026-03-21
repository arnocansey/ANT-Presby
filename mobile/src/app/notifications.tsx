import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

const notificationIcons: Record<string, { icon: React.ComponentProps<typeof Ionicons>['name']; color: string }> = {
  sermon: { icon: 'play-circle-outline', color: '#A855F7' },
  event: { icon: 'calendar-outline', color: '#22C55E' },
  prayer: { icon: 'heart-outline', color: '#F43F5E' },
  giving: { icon: 'gift-outline', color: '#F59E0B' },
  group: { icon: 'people-outline', color: '#3B82F6' },
  announcement: { icon: 'notifications-outline', color: '#6366F1' },
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const notificationsQuery = useMyNotifications(Boolean(user));
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  if (!user) {
    return (
      <BrandScreen>
        <BrandCard>
          <ThemedText type="subtitle">Stay in sync</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sign in to view personal updates, reminders, and announcements from ANT PRESS.
          </ThemedText>
          <Pressable onPress={() => router.replace('/login')} style={[styles.actionButton, { backgroundColor: theme.tint }]}>
            <ThemedText type="defaultSemiBold" style={styles.whiteText}>
              Go To Sign In
            </ThemedText>
          </Pressable>
        </BrandCard>
      </BrandScreen>
    );
  }

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unread_count ?? 0;
  const todayItems = notifications.slice(0, 3);
  const olderItems = notifications.slice(3);

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle">Notifications</ThemedText>
            {unreadCount > 0 ? (
              <View style={styles.countBubble}>
                <ThemedText type="smallBold" style={styles.whiteText}>
                  {String(unreadCount)}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => markAllMutation.mutate()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="checkmark-done-outline" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>

      {notificationsQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading notifications...</ThemedText>
        </BrandCard>
      ) : notifications.length === 0 ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No notifications yet</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Personal updates, event reminders, and announcements will appear here.
          </ThemedText>
        </BrandCard>
      ) : (
        <>
          {todayItems.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                Today
              </ThemedText>
              {todayItems.map((item: any) => (
                <NotificationCard
                  key={String(item.id)}
                  item={item}
                  unread={!item.is_read}
                  onPress={() => !item.is_read && markReadMutation.mutate(item.id)}
                />
              ))}
            </View>
          ) : null}

          {olderItems.length > 0 ? (
            <View style={styles.section}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
                Earlier
              </ThemedText>
              {olderItems.map((item: any) => (
                <NotificationCard
                  key={String(item.id)}
                  item={item}
                  unread={!item.is_read}
                  onPress={() => !item.is_read && markReadMutation.mutate(item.id)}
                />
              ))}
            </View>
          ) : null}
        </>
      )}
    </BrandScreen>
  );
}

function NotificationCard({
  item,
  unread,
  onPress,
}: {
  item: any;
  unread: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const type = String(item?.type || item?.category || 'announcement').toLowerCase();
  const iconMeta = notificationIcons[type] ?? notificationIcons.announcement;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.notificationCard,
        {
          backgroundColor: unread ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
          borderColor: unread ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
        },
      ]}>
      <View style={[styles.notificationIconWrap, { backgroundColor: `${iconMeta.color}22` }]}>
        <Ionicons name={iconMeta.icon} size={18} color={iconMeta.color} />
        {unread ? <View style={styles.unreadDot} /> : null}
      </View>
      <View style={styles.notificationCopy}>
        <ThemedText type="defaultSemiBold">{item?.title || 'Notification'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item?.message || 'No message available.'}
        </ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          {item?.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBubble: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.pill,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  whiteText: {
    color: '#FFFFFF',
  },
  actionButton: {
    minHeight: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notificationCard: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    flexDirection: 'row',
    gap: Spacing.two,
  },
  notificationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#F43F5E',
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
});
