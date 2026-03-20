import React from 'react';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useMyNotifications,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function NotificationsScreen() {
  const user = useAuthStore((state) => state.user);
  const notificationsQuery = useMyNotifications(Boolean(user));
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  if (!user) {
    return (
      <BrandScreen>
        <BrandHero
          eyebrow="Notifications"
          title="Stay in sync"
          description="Sign in to view personal updates from ANT PRESS."
        />
      </BrandScreen>
    );
  }

  const notifications = notificationsQuery.data?.notifications ?? [];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Notifications"
        title="Recent updates"
        description={`${notificationsQuery.data?.unread_count ?? 0} unread updates from ANT PRESS.`}
      >
        <BrandButton label="Mark All Read" onPress={() => markAllMutation.mutate()} />
      </BrandHero>

      {notificationsQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading notifications...</ThemedText>
        </BrandCard>
      ) : notifications.length === 0 ? (
        <BrandCard>
          <ThemedText type="small">No notifications yet.</ThemedText>
        </BrandCard>
      ) : (
        notifications.map((item: any) => (
          <BrandCard key={item.id}>
            {!item.is_read ? <BrandPill>Unread</BrandPill> : null}
            <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
            <ThemedText type="small">{item.message}</ThemedText>
            <ThemedText type="small">{new Date(item.created_at).toLocaleString()}</ThemedText>
            {!item.is_read ? (
              <BrandButton label="Mark As Read" onPress={() => markReadMutation.mutate(item.id)} variant="outline" />
            ) : null}
          </BrandCard>
        ))
      )}
    </BrandScreen>
  );
}
