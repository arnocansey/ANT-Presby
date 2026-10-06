import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import apiClient from '@/lib/api';

// Show notifications while the app is open, too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let registeredToken: string | null = null;

const getProjectId = () =>
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? Constants.easConfig?.projectId;

// Returns this device's Expo push token, or null when push isn't possible (web, simulator, permission denied).
const getExpoPushToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  const projectId = getProjectId();
  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    const token = await getExpoPushToken();
    if (!token) return null;
    await apiClient.post('/push-tokens', { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' });
    registeredToken = token;
    return token;
  } catch {
    return null;
  }
};

export const unregisterPushNotifications = async (): Promise<void> => {
  if (!registeredToken) return;
  try {
    await apiClient.delete('/push-tokens', { data: { token: registeredToken } });
  } finally {
    registeredToken = null;
  }
};

type NotificationData = { type?: string; entityType?: string | null; entityId?: number | null };

// Where tapping a notification should take the member.
export const routeForNotification = (data: NotificationData | undefined): string => {
  switch (data?.entityType) {
    case 'prayer':
      return '/prayer-wall';
    case 'group':
      return '/small-groups';
    case 'event':
      return data.entityId ? `/events/${data.entityId}` : '/notifications';
    case 'devotional':
      return '/daily-devotional';
    case 'news':
      return data.entityId ? `/news/${data.entityId}` : '/notifications';
    default:
      return '/notifications';
  }
};
