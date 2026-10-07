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
let pendingRegistration: Promise<string | null> | null = null;

const getProjectId = () =>
  (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ?? Constants.easConfig?.projectId;

// Returns this device's Expo push token, or null when push isn't possible (web, simulator, permission denied).
// With askPermission false it never prompts: used on sign-out to find a token registered on an earlier launch.
const getExpoPushToken = async (askPermission = true): Promise<string | null> => {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  if (askPermission && Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted || !askPermission ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;

  const projectId = getProjectId();
  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};

const register = async (): Promise<string | null> => {
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

export const registerForPushNotifications = (): Promise<string | null> => {
  const registration = register().finally(() => {
    if (pendingRegistration === registration) pendingRegistration = null;
  });
  pendingRegistration = registration;
  return registration;
};

// Runs before sign-out clears the session. Waits for an in-flight registration so it can't land afterwards,
// and falls back to the device's token when this launch never registered (e.g. it started offline).
export const unregisterPushNotifications = async (): Promise<void> => {
  if (pendingRegistration) {
    await pendingRegistration;
  }
  const token = registeredToken ?? (await getExpoPushToken(false).catch(() => null));
  registeredToken = null;
  if (!token) return;
  await apiClient.delete('/push-tokens', { data: { token } });
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
    case 'album':
      return data.entityId ? `/gallery/${data.entityId}` : '/gallery';
    case 'news':
      return data.entityId ? `/news/${data.entityId}` : '/notifications';
    default:
      return '/notifications';
  }
};
