import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

import { registerForPushNotifications, routeForNotification, unregisterPushNotifications } from '@/lib/push';
import { onBeforeClearSession, useAuthStore } from '@/store/auth';

// Registers this device for push after sign-in, removes it on sign-out, and routes notification taps.
export default function PushRegistration() {
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    if (userId) {
      registerForPushNotifications();
    }
  }, [userId]);

  useEffect(() => onBeforeClearSession(unregisterPushNotifications), []);

  useEffect(() => {
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const data = response.notification.request.content.data as Parameters<typeof routeForNotification>[0];
      router.push(routeForNotification(data) as never);
    };

    Notifications.getLastNotificationResponseAsync().then(open).catch(() => undefined);
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, []);

  return null;
}
